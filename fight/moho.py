"""Чтение ригов Moho (.moho = zip с Project.mohoproj внутри).

Из файла берётся только то, что нужно для перекладки: векторные слои
(MeshLayer), их фигуры (заливка, обводка, толщина, цвет) и порядок слоёв.
Кривые Moho переводятся в кубические кривые Безье, ось y сразу
переворачивается вниз (как в cairo). Единицы остаются как в Moho:
высота кадра проекта = 2 единицы.
"""
import json
import math
import zipfile


def _v(anim):
    """Значение анимируемого параметра на кадре 0 (в ригах ключ всегда один)."""
    if isinstance(anim, dict) and 'val' in anim:
        return anim['val'][0]
    return anim


def _col(c):
    return (c['r'], c['g'], c['b'], c['a'])


class Shape:
    def __init__(self, name, loops, strokes, fill, line, width, has_fill, has_outline):
        self.name = name
        self.loops = loops        # [[(p0, c1, c2, p3), ...], ...] — замкнутые контуры заливки
        self.strokes = strokes    # [(сегмент, множитель толщины), ...] — видимая обводка
        self.fill = fill          # rgba 0..1
        self.line = line
        self.width = width        # толщина обводки в единицах Moho
        self.has_fill = has_fill
        self.has_outline = has_outline


class Layer:
    """Векторный слой. switch — имя слоя-переключателя (eyes/mouth), если слой в нём."""

    def __init__(self, name, shapes, switch=None):
        self.name = name
        self.shapes = shapes
        self.switch = switch

    def bbox(self):
        xs, ys = [], []
        for s in self.shapes:
            for seg in [g for loop in s.loops for g in loop] + [g for g, _ in s.strokes]:
                for p in seg:
                    xs.append(p[0])
                    ys.append(p[1])
        if not xs:
            return None
        return min(xs), min(ys), max(xs), max(ys)


def _rot(v, a):
    c, s = math.cos(a), math.sin(a)
    return (v[0] * c - v[1] * s, v[0] * s + v[1] * c)


def _curve_segments(curve, pts):
    """Сегменты Безье одной кривой Moho: список (i_from, i_to, (p0, c1, c2, p3), видим)."""
    cps = curve['points']
    n = len(cps)
    closed = curve['closed']
    P = [pts[cp['point']] for cp in cps]
    out_h, in_h = [], []
    for i in range(n):
        cur = P[i]
        prv = P[i - 1] if (i > 0 or closed) else None
        nxt = P[(i + 1) % n] if (i < n - 1 or closed) else None
        if prv is not None and nxt is not None:
            # касательная — биссектриса направлений на соседей
            l1 = math.hypot(cur[0] - prv[0], cur[1] - prv[1]) or 1.0
            l2 = math.hypot(nxt[0] - cur[0], nxt[1] - cur[1]) or 1.0
            d = ((cur[0] - prv[0]) / l1 + (nxt[0] - cur[0]) / l2,
                 (cur[1] - prv[1]) / l1 + (nxt[1] - cur[1]) / l2)
        elif nxt is not None:
            d = (nxt[0] - cur[0], nxt[1] - cur[1])
        else:
            d = (cur[0] - prv[0], cur[1] - prv[1])
        ln = math.hypot(*d) or 1.0
        d = (d[0] / ln, d[1] / ln)
        k = _v(cps[i]['smoothness'])
        wo, wi = _v(cps[i]['weight_out']), _v(cps[i]['weight_in'])
        oo, oi = _v(cps[i]['offset_out']), _v(cps[i]['offset_in'])
        lo = k * wo * (math.hypot(nxt[0] - cur[0], nxt[1] - cur[1]) if nxt else 0.0)
        li = k * wi * (math.hypot(cur[0] - prv[0], cur[1] - prv[1]) if prv else 0.0)
        # y уже перевёрнута, поэтому угол смещения ручки тоже с обратным знаком
        vo = _rot(d, -oo)
        vi = _rot(d, -oi)
        out_h.append((cur[0] + vo[0] * lo, cur[1] + vo[1] * lo))
        in_h.append((cur[0] - vi[0] * li, cur[1] - vi[1] * li))
    segs = []
    for i in range(n if closed else n - 1):
        j = (i + 1) % n
        segs.append((cps[i]['point'], cps[j]['point'],
                     (P[i], out_h[i], in_h[j], P[j]), cps[i]['segments_on']))
    return segs


def _chain(edges):
    """Собирает рёбра в цепочки по общим точкам: [(сегменты, номера точек, замкнута)]."""
    left = list(edges)
    out = []
    while left:
        a, b, seg = left.pop(0)
        start, end = a, b
        loop, ids = [seg], {a, b}
        while end != start and left:
            for k, (x, y, s) in enumerate(left):
                if x == end:
                    loop.append(s)
                    end = y
                elif y == end:
                    loop.append((s[3], s[2], s[1], s[0]))
                    end = x
                else:
                    continue
                ids.add(end)
                left.pop(k)
                break
            else:
                break
        out.append((loop, ids, end == start))
    return out


def _fill_loops(edges, curves):
    """Контуры заливки. Если фигура целиком охватывает замкнутые кривые, заливка
    берётся по ним, а рёбра открытых кривых (складки, линии внутри фигуры)
    в заливку не идут — иначе чётно-нечётное правило вырезает дыры."""
    by_curve = {}
    for ci, a, b, seg in edges:
        by_curve.setdefault(ci, []).append((a, b, seg))
    full = [ci for ci, es in by_curve.items()
            if curves[ci]['closed'] and len(es) == len(curves[ci]['points'])]
    if not full:
        return [loop for loop, _, _ in _chain([(a, b, seg) for _, a, b, seg in edges])]
    loops, used = [], set()
    for ci in full:
        for loop, ids, _ in _chain(by_curve[ci]):
            loops.append(loop)
            used |= ids
    rest = [(a, b, seg) for ci, es in by_curve.items() if ci not in full for a, b, seg in es]
    for loop, ids, closed in _chain(rest):
        if closed and not ids & used:
            loops.append(loop)
    return loops


def _mesh_shapes(mesh, xf):
    pts = []
    for p in mesh['points']:
        q = _v(p['position'])
        x, y = xf((q['x'], q['y']))
        pts.append((x, -y))
    curves = [_curve_segments(c, pts) for c in mesh['curves']]
    widths = [_v(p['width']) for p in mesh['points']]
    shapes = []
    for sh in mesh['shapes']:
        st = sh['style']
        e = sh['edges']
        edges, strokes = [], []
        for ci, si in zip(e['curve'], e['segment']):
            a, b, seg, on = curves[ci][si]
            edges.append((ci, a, b, seg))
            if on:
                strokes.append((seg, (widths[a] + widths[b]) / 2))
        w = st['line_width'] * 2.0 * xf.scale
        shapes.append(Shape(sh['name'], _fill_loops(edges, mesh['curves']), strokes,
                            _col(_v(st['fill_color'])), _col(_v(st['line_color'])), w,
                            sh['has_fill'], sh['has_outline']))
    return shapes


class _Xf:
    """Преобразование слоя Moho: p' = R·S·(p − origin) + origin + translation."""

    def __init__(self, layer, parent=None):
        t = layer.get('transforms', {})
        tr = _v(t['translation']) if 'translation' in t else {'x': 0, 'y': 0}
        sc = _v(t['scale']) if 'scale' in t else {'x': 1, 'y': 1}
        self.rz = _v(t['rotation_z']) if 'rotation_z' in t else 0.0
        o = layer.get('origin', {'x': 0, 'y': 0})
        self.o = (o['x'], o['y'])
        self.t = (tr['x'], tr['y'])
        self.s = (sc['x'], sc['y'])
        self.parent = parent
        self.scale = abs(self.s[0]) * (parent.scale if parent else 1.0)

    def __call__(self, p):
        x = (p[0] - self.o[0]) * self.s[0]
        y = (p[1] - self.o[1]) * self.s[1]
        x, y = _rot((x, y), self.rz)
        p = (x + self.o[0] + self.t[0], y + self.o[1] + self.t[1])
        return self.parent(p) if self.parent else p


def load(path):
    """Возвращает список слоёв (снизу вверх) из .moho или Project.mohoproj."""
    if path.endswith('.moho'):
        with zipfile.ZipFile(path) as z:
            name = [n for n in z.namelist() if n.endswith('.mohoproj')][0]
            doc = json.loads(z.read(name))
    else:
        with open(path) as f:
            doc = json.load(f)
    layers = []

    def walk(lst, parent_xf, switch):
        for l in lst:
            xf = _Xf(l, parent_xf)
            if l['type'] == 'MeshLayer':
                layers.append(Layer(l['name'], _mesh_shapes(l['mesh'], xf), switch))
            elif 'layers' in l:
                walk(l['layers'], xf, l['name'] if l['type'] == 'SwitchLayer' else switch)

    walk(doc['layers'], None, None)
    return layers
