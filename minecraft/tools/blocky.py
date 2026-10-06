"""Блочные персонажи: модель из коробок → SVG под любым углом камеры.

Персонаж — набор коробок (голова, тело, руки, ноги, аксессуары). На гранях коробок
нарисованы «наклейки»: лицо, волосы, одежда. Наклейки задаются в координатах грани
(1 единица = 1 «пиксель» блока, u — вправо, v — вниз, если смотреть на грань снаружи)
и переносятся на экран аффинным преобразованием. Проекция ортогональная, поэтому
перенос точный при любом повороте.

Стиль: плоская заливка, одна тень на гранях, которые смотрят вбок, светлая верхняя
грань, толстый контур вокруг каждой коробки и тонкие внутренние рёбра.

Система координат модели: x — к левому боку персонажа (вправо от зрителя на виде
спереди), y — вверх, z — к зрителю. Земля — y = 0.
"""
import math

OUT = '#1c1a1a'       # контур
SW = 7                # контур каждой коробки, px на экране
DET = 3.6             # внутренние рёбра и линии рисунка, px
SHADE = ('#2b2140', 0.28)   # тень: цвет и прозрачность поверх грани
LIGHT = ('#ffffff', 0.16)   # подсветка верхних граней
FONT = "'DejaVu Sans', 'Segoe UI', Arial, sans-serif"

NSS = 'vector-effect="non-scaling-stroke"'


def n(v):
    """Короткая запись числа для SVG."""
    s = f'{v:.2f}'.rstrip('0').rstrip('.')
    return '0' if s in ('-0', '') else s


# ------------------------------------------------------------------ наклейки
# Все функции возвращают SVG-строку в координатах грани. Толщина линий — в px экрана.
def stroke_attrs(stroke, sw):
    if not stroke:
        return 'stroke="none"'
    return (f'stroke="{stroke}" stroke-width="{n(sw)}" stroke-linecap="round" '
            f'stroke-linejoin="round" {NSS}')


def path(d, fill='none', stroke=OUT, sw=DET, extra=''):
    return f'<path d="{d}" fill="{fill}" {stroke_attrs(stroke, sw)}{" " + extra if extra else ""}/>'


def poly(points, fill, stroke=OUT, sw=DET, closed=True, extra=''):
    d = 'M' + ' L'.join(f'{n(x)} {n(y)}' for x, y in points) + (' Z' if closed else '')
    return path(d, fill, stroke, sw, extra)


def line(points, sw=DET, stroke=OUT):
    return poly(points, 'none', stroke, sw, closed=False)


def ell(cx, cy, rx, ry, fill, stroke=OUT, sw=DET, extra=''):
    return (f'<ellipse cx="{n(cx)}" cy="{n(cy)}" rx="{n(rx)}" ry="{n(ry)}" fill="{fill}" '
            f'{stroke_attrs(stroke, sw)}{" " + extra if extra else ""}/>')


def rect(x, y, w, h, fill, stroke=None, sw=DET, r=0, extra=''):
    rr = f' rx="{n(r)}"' if r else ''
    return (f'<rect x="{n(x)}" y="{n(y)}" width="{n(w)}" height="{n(h)}"{rr} fill="{fill}" '
            f'{stroke_attrs(stroke, sw)}{" " + extra if extra else ""}/>')


def mix(c1, c2, t):
    """Смешать два цвета #rrggbb: t=0 → c1, t=1 → c2."""
    a = [int(c1[i:i + 2], 16) for i in (1, 3, 5)]
    b = [int(c2[i:i + 2], 16) for i in (1, 3, 5)]
    return '#' + ''.join(f'{round(x + (y - x) * t):02x}' for x, y in zip(a, b))


def shaded(color):
    """Цвет грани в тени — как он выглядит на рендере."""
    return mix(color, SHADE[0], SHADE[1])


# ------------------------------------------------------------------ геометрия
def rot_matrix(rx, ry, rz):
    """R = Ry · Rx · Rz, углы в градусах."""
    ax, ay, az = (math.radians(a) for a in (rx, ry, rz))
    cx, sx, cy, sy, cz, sz = math.cos(ax), math.sin(ax), math.cos(ay), math.sin(ay), math.cos(az), math.sin(az)
    Rx = ((1, 0, 0), (0, cx, -sx), (0, sx, cx))
    Ry = ((cy, 0, sy), (0, 1, 0), (-sy, 0, cy))
    Rz = ((cz, -sz, 0), (sz, cz, 0), (0, 0, 1))
    return mat(Ry, mat(Rx, Rz))


def mat(A, B):
    return tuple(tuple(sum(A[i][k] * B[k][j] for k in range(3)) for j in range(3)) for i in range(3))


def apply(M, v):
    return tuple(sum(M[i][k] * v[k] for k in range(3)) for i in range(3))


def add(a, b):
    return tuple(x + y for x, y in zip(a, b))


def sub(a, b):
    return tuple(x - y for x, y in zip(a, b))


def scale(a, k):
    return tuple(x * k for x in a)


def hull(points):
    pts = sorted(set((round(x, 3), round(y, 3)) for x, y in points))
    if len(pts) <= 2:
        return pts

    def cross(o, a, b):
        return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])
    lower, upper = [], []
    for p in pts:
        while len(lower) >= 2 and cross(lower[-2], lower[-1], p) <= 0:
            lower.pop()
        lower.append(p)
    for p in reversed(pts):
        while len(upper) >= 2 and cross(upper[-2], upper[-1], p) <= 0:
            upper.pop()
        upper.append(p)
    return lower[:-1] + upper[:-1]


# Грани коробки w×h×d в её локальных координатах (0..w, 0..h, 0..d):
# нормаль, угол-начало, ось u, ось v. Смотрим на грань снаружи: u вправо, v вниз.
def face_frames(w, h, d):
    return {
        'front':  ((0, 0, 1),  (0, h, d), (1, 0, 0),  (0, -1, 0), w, h),
        'back':   ((0, 0, -1), (w, h, 0), (-1, 0, 0), (0, -1, 0), w, h),
        'left':   ((1, 0, 0),  (w, h, d), (0, 0, -1), (0, -1, 0), d, h),   # левый бок персонажа
        'right':  ((-1, 0, 0), (0, h, 0), (0, 0, 1),  (0, -1, 0), d, h),   # правый бок персонажа
        'top':    ((0, 1, 0),  (0, h, 0), (1, 0, 0),  (0, 0, 1),  w, d),
        'bottom': ((0, -1, 0), (0, 0, d), (1, 0, 0),  (0, 0, -1), w, d),
    }


VERTICAL = ('front', 'back', 'left', 'right')


class Box:
    """Коробка персонажа.

    size  — (w, h, d) в единицах-пикселях блока;
    at    — угол с минимальными x, y, z в координатах модели;
    color — цвет граней: строка или словарь {'front': ..., 'top': ..., 'default': ...};
    decals — наклейки: {'front' | 'back' | 'left' | 'right' | 'top' | 'bottom' |
             'side' | 'around': список строк или функция (ширина, высота) -> список}.
             'side' рисуется на обоих боках, на правом — зеркально, так что u=0 всегда
             у переднего ребра. 'around' — на всех четырёх вертикальных гранях.
    pivot, rot — точка поворота и углы (x, y, z) в градусах — для поз;
    after — имена коробок, поверх которых эта рисуется всегда.
    """

    def __init__(self, name, size, at, color, decals=None, pivot=None, rot=(0, 0, 0), after=()):
        self.name, self.size, self.at = name, size, at
        self.color = color if isinstance(color, dict) else {'default': color}
        self.decals = decals or {}
        w, h, d = size
        self.pivot = pivot or add(at, (w / 2, h / 2, d / 2))
        self.rot = rot
        self.after = tuple(after)

    def posed(self, rot=None, pivot=None):
        b = Box(self.name, self.size, self.at, self.color, self.decals, pivot or self.pivot,
                rot if rot is not None else self.rot, self.after)
        return b

    def face_color(self, face):
        return self.color.get(face, self.color['default'])

    def face_decals(self, face, ul, vl):
        items = []
        keys = ['around'] if face in VERTICAL else []
        if face in ('left', 'right'):
            keys.append('side')
        keys.append(face)
        for k in keys:
            dec = self.decals.get(k)
            if dec is None:
                continue
            parts = dec(ul, vl) if callable(dec) else dec
            if not parts:
                continue
            body = ''.join(parts)
            if k == 'side' and face == 'right':
                body = f'<g transform="matrix(-1 0 0 1 {n(ul)} 0)">{body}</g>'
            items.append(body)
        return ''.join(items)


class Camera:
    """Ортогональная камера: yaw — поворот персонажа вокруг вертикали (градусы,
    отрицательный — персонаж поворачивается к левому краю кадра), pitch — взгляд
    сверху (градусы). origin — точка земли под центром модели на холсте, S — px на единицу."""

    def __init__(self, yaw=0, pitch=0, S=34, origin=(300, 950)):
        self.V = mat(rot_matrix(pitch, 0, 0), rot_matrix(0, yaw, 0))
        self.S, self.origin = S, origin

    def view(self, p):
        return apply(self.V, p)

    def screen(self, p):
        q = self.view(p)
        return (self.origin[0] + q[0] * self.S, self.origin[1] - q[1] * self.S)


def render(boxes, cam, pfx='v'):
    """SVG-разметка (без обёртки <svg>) всех коробок, от дальних к ближним."""
    items = []
    for b in boxes:
        R = rot_matrix(*b.rot)

        def model(local, b=b, R=R):
            p = add(b.at, local)
            return add(b.pivot, apply(R, sub(p, b.pivot)))
        w, h, d = b.size
        center = model((w / 2, h / 2, d / 2))
        items.append((cam.view(center)[2], b, R, model))

    items.sort(key=lambda t: t[0])
    order = [t[1].name for t in items]
    # «после» — жёсткое правило поверх сортировки по глубине
    for _ in range(len(items)):
        moved = False
        for i, (_, b, _, _) in enumerate(items):
            for target in b.after:
                if target in order and order.index(target) > i:
                    j = order.index(target)
                    items.insert(j, items.pop(i))
                    order.insert(j, order.pop(i))
                    moved = True
                    break
            if moved:
                break
        if not moved:
            break

    out = []
    for _, b, R, model in items:
        w, h, d = b.size
        frames = face_frames(w, h, d)
        visible = []
        for face, (nrm, o, U, Vv, ul, vl) in frames.items():
            nv = cam.view(apply(R, nrm))
            if nv[2] > 0.02:
                visible.append((face, nv, o, U, Vv, ul, vl))
        if not visible:
            continue
        lit = max((f for f in visible if abs(f[1][1]) < 0.55), key=lambda f: f[1][2], default=None)
        parts = []
        all_pts = []
        for face, nv, o, U, Vv, ul, vl in visible:
            O = model(o)
            corners = [O, model(add(o, scale(U, ul))), model(add(add(o, scale(U, ul)), scale(Vv, vl))),
                       model(add(o, scale(Vv, vl)))]
            pts = [cam.screen(c) for c in corners]
            all_pts += pts
            poly_d = 'M' + ' L'.join(f'{n(x)} {n(y)}' for x, y in pts) + ' Z'
            s0 = cam.screen(O)
            su = sub(cam.screen(model(add(o, U))), s0)
            sv = sub(cam.screen(model(add(o, Vv))), s0)
            M = f'matrix({n(su[0])} {n(su[1])} {n(sv[0])} {n(sv[1])} {n(s0[0])} {n(s0[1])})'
            g = [f'<path d="{poly_d}" fill="{b.face_color(face)}"/>']
            dec = b.face_decals(face, ul, vl)
            if dec:
                g.append(f'<g transform="{M}">{dec}</g>')
            if nv[1] > 0.55:
                g.append(f'<path d="{poly_d}" fill="{LIGHT[0]}" opacity="{LIGHT[1]}"/>')
            elif lit is None or face != lit[0]:
                g.append(f'<path d="{poly_d}" fill="{SHADE[0]}" opacity="{SHADE[1]}"/>')
            g.append(f'<path d="{poly_d}" fill="none" stroke="{OUT}" stroke-width="{DET}" '
                     f'stroke-linejoin="round"/>')
            parts.append(f'<g class="face-{face}">' + ''.join(g) + '</g>')
        hp = hull(all_pts)
        parts.append(f'<path d="M{" L".join(f"{n(x)} {n(y)}" for x, y in hp)} Z" fill="none" '
                     f'stroke="{OUT}" stroke-width="{SW}" stroke-linejoin="round"/>')
        out.append(f'<g id="{pfx}-{b.name}">\n  ' + '\n  '.join(parts) + '\n</g>')
    return '\n'.join(out)


def bounds(boxes, cam):
    pts = []
    for b in boxes:
        R = rot_matrix(*b.rot)
        w, h, d = b.size
        for cx in (0, w):
            for cy in (0, h):
                for cz in (0, d):
                    p = add(b.pivot, apply(R, sub(add(b.at, (cx, cy, cz)), b.pivot)))
                    pts.append(cam.screen(p))
    xs, ys = [p[0] for p in pts], [p[1] for p in pts]
    return min(xs), min(ys), max(xs), max(ys)


def svg(w, h, body, title='', bg=None):
    t = f'<title>{title}</title>\n' if title else ''
    b = f'<rect width="{w}" height="{h}" fill="{bg}"/>\n' if bg else ''
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {n(w)} {n(h)}" '
            f'width="{n(w)}" height="{n(h)}">\n{t}{b}{body}\n</svg>\n')


def text(x, y, s, size=30, weight=700, fill='#5b524a', anchor='middle', spacing=0, family=FONT):
    ls = f' letter-spacing="{spacing}"' if spacing else ''
    return (f'<text x="{n(x)}" y="{n(y)}" text-anchor="{anchor}" font-family="{family}" '
            f'font-size="{size}" font-weight="{weight}" fill="{fill}"{ls}>{s}</text>')
