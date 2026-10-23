#!/usr/bin/env python3
"""Экспорт риговых персонажей Moho (.moho) по слоям: SVG + rig.json.

    python3 tools/moho_export.py                     # все файлы из moho/
    python3 tools/moho_export.py "moho/fat verity small.moho"

На каждого персонажа создаётся папка rigs/<имя>/:
    svg/NN-слой.svg   каждый векторный слой отдельно, на общем холсте персонажа
    rig.json          кости (суставы в пикселях), привязка слоёв к костям,
                      порядок отрисовки, switch-слои (рты, глаза)
PNG из этих SVG делает tools/render_rigs.js.

Всё считается в позе покоя (кадр 0 Moho): кости там ничего не деформируют,
поэтому каждая часть лежит ровно там, где её нарисовали. Холст у всех слоёв
одного персонажа общий, так что PNG, положенные друг на друга, сами встают
на места.

Формат .moho — zip с Project.mohoproj (JSON). Формулы кривых, толщины линий и
трансформаций слоёв сверены с описанием формата, восстановленным по экспорту
самого Moho: https://github.com/vinhio/moho2svg (docs/moho-svg-internals.md).
"""
import base64
import json
import math
import os
import re
import sys
import zipfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC_DIR = os.path.join(ROOT, 'moho')
OUT_DIR = os.path.join(ROOT, 'rigs')

PAD = 24            # поля холста вокруг персонажа, px
TANGENT_BIAS = 0.19  # направление касательной в точке кривой (см. curve_segments)


# ------------------------------------------------------------------ каналы
def val(ch):
    """Значение анимируемого канала Moho в кадре 0."""
    if not isinstance(ch, dict) or 'val' not in ch:
        return ch
    best = 0
    for i, w in enumerate(ch['when']):
        if w <= 0:
            best = i
    return ch['val'][best]


# ------------------------------------------------------------------ аффинные матрицы
# (a, b, c, d, e, f): x' = a*x + c*y + e,  y' = b*x + d*y + f
IDENT = (1.0, 0.0, 0.0, 1.0, 0.0, 0.0)


def mul(m, n):
    """m∘n: сначала n, потом m."""
    a, b, c, d, e, f = m
    a2, b2, c2, d2, e2, f2 = n
    return (a * a2 + c * b2, b * a2 + d * b2,
            a * c2 + c * d2, b * c2 + d * d2,
            a * e2 + c * f2 + e, b * e2 + d * f2 + f)


def apply(m, p):
    a, b, c, d, e, f = m
    return (a * p[0] + c * p[1] + e, b * p[0] + d * p[1] + f)


def layer_matrix(L):
    """p' = origin + translation + R·S·(p - origin); флипы меняют знак масштаба."""
    t = L['transforms']
    tr, sc, rz = val(t['translation']), val(t['scale']), val(t['rotation_z'])
    sx, sy = sc['x'], sc['y']
    if val(t['flip_h']):
        sx = -sx
    if val(t['flip_v']):
        sy = -sy
    co, si = math.cos(rz), math.sin(rz)
    ox, oy = L['origin']['x'], L['origin']['y']
    m = (co * sx, si * sx, -si * sy, co * sy, 0.0, 0.0)
    e = ox + tr['x'] - (m[0] * ox + m[2] * oy)
    f = oy + tr['y'] - (m[1] * ox + m[3] * oy)
    return (m[0], m[1], m[2], m[3], e, f)


def mat_scale(m):
    return math.sqrt(abs(m[0] * m[3] - m[1] * m[2]))


# ------------------------------------------------------------------ кривые
def curve_segments(mesh, ci, pos, width):
    """Сегменты кривой как кубические Безье в координатах слоя.

    Moho хранит не ручки, а «кривизну» точки (smoothness), вес и поворот ручки:
      длина ручки = расстояние до соседа * smoothness * weight;
      направление — смесь единичных хорд (P - prev) и (next - P), каждая с
      весом длины другой хорды в степени 0.19; затем поворот на offset.
    """
    cur = mesh['curves'][ci]
    cps = cur['points']
    n = len(cps)
    closed = cur['closed']
    idx = [cp['point'] for cp in cps]

    def clamp(k):
        return (k + n) % n if closed else max(0, min(n - 1, k))

    def handle(i, incoming):
        cp = cps[i]
        p = pos[idx[i]]
        nxt, prv = clamp(i + 1), clamp(i - 1)
        second = prv if incoming else nxt
        if second == i:
            return p
        curv = val(cp['smoothness'])
        weight = val(cp['weight_in'] if incoming else cp['weight_out'])
        offset = val(cp['offset_in'] if incoming else cp['offset_out'])
        a, b = pos[idx[nxt]], pos[idx[prv]]
        ux, uy = p[0] - b[0], p[1] - b[1]
        vx, vy = a[0] - p[0], a[1] - p[1]
        du, dv = math.hypot(ux, uy), math.hypot(vx, vy)
        if du < 1e-12 or dv < 1e-12:
            dx, dy = a[0] - b[0], a[1] - b[1]
        else:
            ku = dv ** TANGENT_BIAS / du
            kv = du ** TANGENT_BIAS / dv
            dx, dy = ux * ku + vx * kv, uy * ku + vy * kv
        ln = math.hypot(dx, dy)
        if ln < 1e-12:
            return p
        dx, dy = dx / ln, dy / ln
        if incoming:
            dx, dy = -dx, -dy
        q = pos[idx[second]]
        hl = math.hypot(p[0] - q[0], p[1] - q[1]) * curv * weight
        co, si = math.cos(offset), math.sin(offset)
        hx, hy = dx * hl, dy * hl
        return (p[0] + hx * co - hy * si, p[1] + hx * si + hy * co)

    segs = []
    for s in range(n if closed else n - 1):
        i, j = s, (s + 1) % n
        segs.append({
            'p0': pos[idx[i]], 'c1': handle(i, False), 'c2': handle(j, True), 'p1': pos[idx[j]],
            'on': cps[i]['segments_on'], 'w0': width[idx[i]], 'w1': width[idx[j]],
            'curve': ci, 'seg': s, 'n': n if closed else n - 1, 'closed': closed,
        })
    return segs


def reverse(sg):
    r = dict(sg)
    r.update(p0=sg['p1'], c1=sg['c2'], c2=sg['c1'], p1=sg['p0'], w0=sg['w1'], w1=sg['w0'])
    return r


def key(p):
    return (round(p[0] * 1e5), round(p[1] * 1e5))


def fill_loops(segs):
    """Замкнутые контуры заливки из рёбер фигуры.

    Список рёбер в файле — это просто набор сегментов, порядок и флаги в нём
    ненадёжны, поэтому контуры собираются заново как циклы графа. Висячие
    цепочки (внутренние линии, прикреплённые к краю) заливку не ограничивают —
    их отрезаем; они остаются только в обводке.
    """
    live = list(range(len(segs)))
    while True:
        deg = {}
        for i in live:
            for k in (key(segs[i]['p0']), key(segs[i]['p1'])):
                deg[k] = deg.get(k, 0) + 1
        keep = [i for i in live if deg[key(segs[i]['p0'])] > 1 and deg[key(segs[i]['p1'])] > 1]
        if len(keep) == len(live):
            break
        live = keep
    at = {}
    for i in live:
        for k in (key(segs[i]['p0']), key(segs[i]['p1'])):
            at.setdefault(k, []).append(i)
    used = set()
    loops = []
    for start in live:
        if start in used:
            continue
        used.add(start)
        sg = segs[start]
        path = [sg]
        k0, cur = key(sg['p0']), key(sg['p1'])
        last = sg
        while cur != k0:
            cand = [i for i in at.get(cur, []) if i not in used]
            if not cand:
                break
            # продолжаем по той же кривой, если можно — так контур идёт как нарисован
            cand.sort(key=lambda i: (segs[i]['curve'] != last['curve'],
                                     abs(segs[i]['seg'] - last['seg']) not in (1, last['n'] - 1)))
            i = cand[0]
            used.add(i)
            nx = segs[i] if key(segs[i]['p0']) == cur else reverse(segs[i])
            path.append(nx)
            cur = key(nx['p1'])
            last = segs[i]
        loops.append(path)
    return loops


def stroke_chains(segs):
    """Видимые сегменты обводки, собранные в непрерывные цепочки по каждой кривой."""
    by_curve = {}
    for sg in segs:
        if sg['on']:
            by_curve.setdefault(sg['curve'], {})[sg['seg']] = sg
    chains = []
    for ci in sorted(by_curve):
        d = by_curve[ci]
        any_sg = next(iter(d.values()))
        n, closed = any_sg['n'], any_sg['closed']
        order = sorted(d)
        if closed and len(order) < n:
            # начинаем сразу после разрыва, чтобы цепочка не резалась на стыке 0/n-1
            gaps = [s for s in order if (s - 1) % n not in d]
            k = order.index(gaps[0])
            order = order[k:] + order[:k]
        chain = []
        for s in order:
            if chain and chain[-1]['seg'] != (s - 1) % n:
                chains.append(chain)
                chain = []
            chain.append(d[s])
        if chain:
            chains.append(chain)
    return chains


# ------------------------------------------------------------------ SVG
def fmt(v):
    s = f'{v:.2f}'.rstrip('0').rstrip('.')
    return '0' if s in ('-0', '') else s


def pt(p):
    return f'{fmt(p[0])} {fmt(p[1])}'


def path_d(chain, close):
    d = [f'M{pt(chain[0]["p0"])}']
    for sg in chain:
        d.append(f'C{pt(sg["c1"])} {pt(sg["c2"])} {pt(sg["p1"])}')
    if close:
        d.append('Z')
    return ''.join(d)


def color(c):
    r, g, b = (max(0, min(255, round(c[k] * 255))) for k in 'rgb')
    return f'#{r:02x}{g:02x}{b:02x}', c['a']


def split(sg, t0, t1):
    """Кусок кубической кривой между параметрами t0..t1."""
    def lerp(a, b, t):
        return (a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t)

    def cut(p0, p1, p2, p3, t):   # де Кастельжо: (левая половина, правая половина)
        a, b, c = lerp(p0, p1, t), lerp(p1, p2, t), lerp(p2, p3, t)
        d, e = lerp(a, b, t), lerp(b, c, t)
        f = lerp(d, e, t)
        return (p0, a, d, f), (f, e, c, p3)

    q = (sg['p0'], sg['c1'], sg['c2'], sg['p1'])
    if t1 < 1:
        q = cut(*q, t1)[0]
    if t0 > 0:
        q = cut(*q, t0 / t1)[1]
    return q


class Canvas:
    """Отображение координат Moho в пиксели (камера по умолчанию: 2 единицы = высота кадра)."""

    def __init__(self, doc):
        pd = doc['project_data']
        av = doc['animated_values']
        self.W, self.H = pd['width'], pd['height']
        cam = val(av['camera_track'])
        zoom = val(av['camera_zoom'])
        self.cx, self.cy = cam['x'], cam['y']
        self.k = (self.H / 2) / (cam['z'] * math.tan(math.pi / 6 / zoom))
        self.dx = self.dy = 0.0     # сдвиг обрезки, задаётся после подсчёта рамки

    def px(self, p):
        return ((p[0] - self.cx) * self.k + self.W / 2 - self.dx,
                self.H / 2 - (p[1] - self.cy) * self.k - self.dy)

    def matrix(self):
        """То же, что px(), в виде аффинной матрицы."""
        return (self.k, 0.0, 0.0, -self.k,
                self.W / 2 - self.cx * self.k - self.dx, self.H / 2 + self.cy * self.k - self.dy)


# ------------------------------------------------------------------ картинки (ImageLayer)
class Textures:
    """Картинки из слоёв-изображений: один <image> в <defs> на документ, дальше <use>."""

    def __init__(self, src):
        self.base = os.path.dirname(os.path.abspath(src))
        self.items = {}     # путь -> (id, data URI, ширина, высота)

    def find(self, L):
        rel = L['image_path'].replace('\\', '/')
        for cand in (os.path.join(self.base, rel),
                     os.path.join(self.base, 'Images', os.path.basename(rel))):
            if os.path.isfile(cand):
                return cand
        return None

    def use(self, L, m, cv):
        """<use> картинки слоя L (матрица m — все трансформации до слоя костей включительно)."""
        path = self.find(L)
        if not path:
            print(f'  ! нет картинки {L["image_path"]} (слой {L["name"]})', file=sys.stderr)
            return ''
        if path not in self.items:
            with open(path, 'rb') as f:
                raw = f.read()
            if raw[:8] != b'\x89PNG\r\n\x1a\n':
                raise SystemExit(f'поддерживаются только PNG: {path}')
            iw, ih = int.from_bytes(raw[16:20], 'big'), int.from_bytes(raw[20:24], 'big')
            uri = 'data:image/png;base64,' + base64.b64encode(raw).decode('ascii')
            self.items[path] = (f'tex{len(self.items)}', uri, iw, ih)
        tid, _, iw, ih = self.items[path]
        # пиксель картинки -> слой: картинка занимает ±width/2 × ±height/2 вокруг начала слоя
        W, H = L['width'], L['height']
        img = (W / iw, 0.0, 0.0, -H / ih, -W / 2, H / 2)
        a, b, c, d, e, f = mul(cv.matrix(), mul(m, img))
        return f'<use href="#{tid}" transform="matrix({a:.5f} {b:.5f} {c:.5f} {d:.5f} {e:.2f} {f:.2f})"/>'

    def defs(self, body):
        used = [v for v in self.items.values() if f'href="#{v[0]}"' in body]
        if not used:
            return ''
        return '<defs>' + ''.join(f'<image id="{tid}" width="{iw}" height="{ih}" preserveAspectRatio="none" '
                                  f'href="{uri}"/>' for tid, uri, iw, ih in used) + '</defs>\n'


def mesh_svg(L, m, cv, overlay='', uid=''):
    """SVG-элементы векторного слоя (в пикселях холста) и рамка нарисованного.

    overlay — картинки, которые в Moho обрезаны маской этого слоя (группа с
    маской «скрыть всё», слой «+ добавить в маску», картинки «по маске»). Маска —
    заливки слоя; при «исключить линии из маски» линии слоя лежат поверх картинок.
    """
    mesh = L['mesh']
    to_px = lambda p: cv.px(apply(m, p))
    # ручки строятся в собственных координатах слоя (ось Y вверх, как в Moho),
    # и только потом все четыре точки сегмента переводятся в пиксели
    pos = [(val(p['position'])['x'], val(p['position'])['y']) for p in mesh['points']]
    width = [val(p['width']) for p in mesh['points']]
    curves = []
    for ci in range(len(mesh['curves'])):
        segs = curve_segments(mesh, ci, pos, width)
        for sg in segs:
            for k in ('p0', 'c1', 'c2', 'p1'):
                sg[k] = to_px(sg[k])
        curves.append(segs)
    # толщина линии в Moho — доля высоты кадра; масштаб слоёв её тоже меняет
    line_k = mat_scale(m) * cv.k * 2
    out = []            # заливка и линии каждой фигуры по очереди
    fills, lines, clip = [], [], []
    xs, ys = [], []

    def grow(chain, pad):
        for sg in chain:
            for p in (sg['p0'], sg['c1'], sg['c2'], sg['p1']):
                xs.extend((p[0] - pad, p[0] + pad))
                ys.extend((p[1] - pad, p[1] + pad))

    for sh in mesh['shapes']:
        segs = [curves[c][s] for c, s in zip(sh['edges']['curve'], sh['edges']['segment'])
                if s < len(curves[c])]
        if not segs:
            continue
        st = sh['style']
        if sh['has_fill']:
            loops = fill_loops(segs)
            if loops:
                hexc, a = color(val(st['fill_color']))
                op = f' fill-opacity="{fmt(a)}"' if a < 1 else ''
                d = ''.join(path_d(lp, True) for lp in loops)
                out.append(f'<path d="{d}" fill="{hexc}"{op} fill-rule="evenodd"/>')
                fills.append(out[-1])
                clip.append(f'<path d="{d}" clip-rule="evenodd"/>')
                for lp in loops:
                    grow(lp, 0)
        if sh['has_outline']:
            lw = st['line_width'] * line_k
            hexc, a = color(val(st['line_color']))
            cap = {0: 'butt', 2: 'square'}.get(st.get('line_caps', 1), 'round')
            op = f' stroke-opacity="{fmt(a)}"' if a < 1 else ''
            attrs = f'fill="none" stroke="{hexc}"{op} stroke-linecap="{cap}" stroke-linejoin="round"'
            for chain in stroke_chains(segs):
                ws = {sg['w0'] for sg in chain} | {sg['w1'] for sg in chain}
                if len(ws) == 1:
                    w = lw * ws.pop()
                    if w > 0:
                        out.append(f'<path d="{path_d(chain, False)}" {attrs} stroke-width="{fmt(w)}"/>')
                        lines.append(out[-1])
                        grow(chain, w / 2)
                    continue
                # линия переменной толщины: режем на короткие куски, у каждого своя толщина
                pieces = []
                for sg in chain:
                    k = 16
                    for i in range(k):
                        t0, t1 = i / k, (i + 1) / k
                        w = lw * (sg['w0'] + (sg['w1'] - sg['w0']) * (t0 + t1) / 2)
                        if w <= 0.05:
                            continue
                        q = split(sg, t0, t1)
                        pieces.append(f'<path d="M{pt(q[0])}C{pt(q[1])} {pt(q[2])} {pt(q[3])}" '
                                      f'stroke-width="{fmt(w)}"/>')
                    grow([sg], lw * max(sg['w0'], sg['w1']) / 2)
                if pieces:
                    out.append(f'<g {attrs}>' + ''.join(pieces) + '</g>')
                    lines.append(out[-1])
    if overlay and clip:
        if not L.get('exclude_lines_from_mask'):
            print(f'  ! {L["name"]}: линии входят в маску — картинка ляжет и на них', file=sys.stderr)
            lines, fills = [], out
        out = (fills + [f'<clipPath id="clip-{uid}">' + ''.join(clip) + '</clipPath>',
                        f'<g clip-path="url(#clip-{uid})">{overlay}</g>'] + lines)
    bbox = (min(xs), min(ys), max(xs), max(ys)) if xs else None
    return out, bbox


# ------------------------------------------------------------------ кости
def bone_world(skel):
    """Мировые матрицы костей в позе покоя (в системе координат слоя костей)."""
    bones = skel['bones']
    world = [None] * len(bones)

    def get(i):
        if world[i] is None:
            b = bones[i]
            ang, sc, p = val(b['anim_angle']), val(b['anim_scale']), val(b['anim_pos'])
            across = 1.0 if b.get('scaling_mode') == 2 else sc
            co, si = math.cos(ang), math.sin(ang)
            local = (co * sc, si * sc, -si * across, co * across, p['x'], p['y'])
            par = b['parent']
            world[i] = mul(get(par), local) if 0 <= par < len(bones) else local
        return world[i]

    for i in range(len(bones)):
        get(i)
    return world


# ------------------------------------------------------------------ обход слоёв
def slug(s):
    s = re.sub(r'[^\w]+', '-', s.strip().lower(), flags=re.UNICODE).strip('-')
    return s or 'layer'


def collect(doc):
    """Плоский список рисуемых слоёв в порядке отрисовки (снизу вверх).

    Слои-картинки отдельно не выгружаются: в этих ригах они — текстура, которую
    маска группы обрезает по векторным слоям. Такие картинки прикладываются к
    слою-источнику маски (item['overlay']).
    """
    items = []
    skel = None

    def walk(L, m, path, switch, overlay=()):
        nonlocal skel
        m = mul(m, layer_matrix(L))
        t = L['type']
        if t == 'BoneLayer' and skel is None:
            skel = {'layer': L, 'matrix': m}
        if t == 'MeshLayer':
            items.append({'layer': L, 'matrix': m, 'path': path + [L['name']], 'switch': switch,
                          'overlay': list(overlay)})
        elif t == 'ImageLayer' and not overlay_of.get(id(L)):
            print(f'  ! слой-картинка вне маски пропущен: {"/".join(path + [L["name"]])}', file=sys.stderr)
        kids = L.get('layers', [])
        if L.get('group_mask') and t != 'SwitchLayer':
            # маска группы строится по порядку: картинка «по маске» (0) обрезается
            # слоями «+ в маску» (2), которые лежат под ней
            for c in kids:
                if c['masking'] not in (0, 1, 2):
                    print(f'  ! режим маски {c["masking"]} не поддержан: {c["name"]}', file=sys.stderr)
                if c['type'] == 'ImageLayer' and c['masking'] == 0:
                    overlay_of[id(c)] = True
            mask_overlays = {}
            for i, c in enumerate(kids):
                if c['type'] == 'MeshLayer' and c['masking'] == 2:
                    mask_overlays[i] = [(k, mul(m, layer_matrix(k))) for k in kids[i + 1:]
                                        if k['type'] == 'ImageLayer' and k['masking'] == 0]
                elif c['type'] == 'MeshLayer' and c['masking'] == 0:
                    print(f'  ! векторный слой по маске не поддержан: {c["name"]}', file=sys.stderr)
            sub = path if t == 'BoneLayer' else path + [L['name']]
            for i, c in enumerate(kids):
                walk(c, m, sub, switch, mask_overlays.get(i, ()))
            return
        if t == 'SwitchLayer':
            sw = {'layer': L}
            for c in L.get('layers', []):
                walk(c, m, path + [L['name']], sw)
            return
        sub = path if t == 'BoneLayer' else path + [L['name']]   # корневой слой костей в путь не пишем
        for c in L.get('layers', []):
            walk(c, m, sub, switch)

    overlay_of = {}
    for L in doc['layers']:
        walk(L, IDENT, [], None)
    return items, skel


def bone_records(skel, cv):
    """Кости в пикселях холста: начало (сустав), конец, угол, длина."""
    out = []
    if not skel:
        return out
    sk = skel['layer']['skeleton']
    world = bone_world(sk)
    for i, b in enumerate(sk['bones']):
        wm = mul(skel['matrix'], world[i])
        base = cv.px(apply(wm, (0, 0)))
        tip = cv.px(apply(wm, (b['length'], 0)))
        out.append({
            'index': i, 'name': b['name'],
            'parent': sk['bones'][b['parent']]['name'] if 0 <= b['parent'] < len(sk['bones']) else None,
            'base': [round(base[0], 1), round(base[1], 1)],
            'tip': [round(tip[0], 1), round(tip[1], 1)],
            'angle_deg': round(math.degrees(math.atan2(tip[1] - base[1], tip[0] - base[0])), 2),
            'length_px': round(math.hypot(tip[0] - base[0], tip[1] - base[1]), 1),
            'strength': b['strength'],
            'drives': [],
        })
    return out


def binding(L, sw, bones):
    """Как слой следует за костями: (тип, главная кость, подробности).

    Привязка switch-слоя главнее привязки его детей (как в Moho: снаружи внутрь).
    """
    names = [b['name'] for b in bones]
    by = lambda i: names[i] if 0 <= i < len(names) else None
    pts = {}
    for p in L['mesh']['points']:
        if by(p['parent']):
            pts[by(p['parent'])] = pts.get(by(p['parent']), 0) + 1
    holder = (by(sw['layer']['parent_bone']) if sw else None) or by(L['parent_bone'])
    if holder:
        return 'rigid', holder, {}
    if pts:
        # точки слоя привязаны к разным костям; главная — та, к которой их больше
        return 'points', max(pts, key=pts.get), {'point_bones': pts}
    sub = [by(int(x)) for x in (L.get('flexi_bone_subset') or '').split('|') if x]
    sub = [b for b in sub if b]
    if L['parent_bone'] == -1 and sub:
        # гибкая привязка к нескольким костям; главная — ближайшая к корню скелета
        parent = {b['name']: b['parent'] for b in bones}

        def depth(n):
            d = 0
            while parent.get(n):
                n, d = parent[n], d + 1
            return d
        return 'flexible', min(sub, key=depth), {'flexible_bones': sub}
    return 'none', None, {}


def svg_doc(w, h, body, comment='', tex=None):
    c = f'<!-- {comment} -->\n' if comment else ''
    defs = tex.defs(body) if tex else ''
    return (f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}">\n'
            f'{c}{defs}{body}\n</svg>\n')


def bones_svg(bones):
    out = []
    for b in bones:
        (x, y), (tx, ty) = b['base'], b['tip']
        if b['length_px'] > 1:
            out.append(f'<line x1="{x}" y1="{y}" x2="{tx}" y2="{ty}" stroke="#13a8d8" stroke-width="5" '
                       f'stroke-linecap="round" opacity=".85"/>')
        out.append(f'<circle cx="{x}" cy="{y}" r="9" fill="none" stroke="#e0233a" stroke-width="3"/>')
        out.append(f'<text x="{x + 12}" y="{y - 8}" font-family="DejaVu Sans, Arial, sans-serif" '
                   f'font-size="20" fill="#b0102a" stroke="#fff" stroke-width="4" paint-order="stroke">'
                   f'{b["name"]}</text>')
    return '<g>' + ''.join(out) + '</g>'


def variants_svg(switches, recs, bg):
    """Лист вариантов switch-слоёв: каждый рот/глаза на лице персонажа, с подписью."""
    TILE, LABEL, GAP = 300, 34, 10
    tiles = []
    for sw in switches:
        kids = sw['children']
        x0 = min(c['bbox'][0] for c in kids); y0 = min(c['bbox'][1] for c in kids)
        x1 = max(c['bbox'][2] for c in kids); y1 = max(c['bbox'][3] for c in kids)
        side = max(x1 - x0, y1 - y0) * 1.35 + 40
        cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
        vb = f'{fmt(cx - side / 2)} {fmt(cy - side / 2)} {fmt(side)} {fmt(side)}'
        # остальной персонаж — бледным фоном (одной группой, чтобы слои не просвечивали друг через друга)
        under, over = [], []
        for r in recs:
            if r['switch'] is not sw and (r['switch'] is None or r['rec']['name'] == r['switch']['default']):
                (under if r['rec']['order'] < sw['order'] else over).append(''.join(r['svg']))
        fade = lambda parts: f'<g opacity=".4">{"".join(parts)}</g>' if parts else ''
        for c in kids:
            body = fade(under) + ''.join(''.join(r['svg']) for r in recs if r['rec'] is c) + fade(over)
            # у каждой плитки свои id масок, чтобы они не повторялись в документе
            body = body.replace('"clip-', f'"clip-t{len(tiles)}-').replace('#clip-', f'#clip-t{len(tiles)}-')
            tiles.append((sw['name'], c['name'], c['name'] == sw['default'], vb, body))
    if not tiles:
        return None
    cols = min(6, len(tiles))
    rows = (len(tiles) + cols - 1) // cols
    W = cols * (TILE + GAP) + GAP
    H = rows * (TILE + LABEL + GAP) + GAP
    out = [f'<rect width="{W}" height="{H}" fill="#fff"/>']
    for i, (sname, cname, is_def, vb, body) in enumerate(tiles):
        x = GAP + (i % cols) * (TILE + GAP)
        y = GAP + (i // cols) * (TILE + LABEL + GAP)
        out.append(f'<rect x="{x}" y="{y}" width="{TILE}" height="{TILE}" fill="{bg}"'
                   + (' stroke="#e0233a" stroke-width="4"' if is_def else '') + '/>')
        out.append(f'<svg x="{x}" y="{y}" width="{TILE}" height="{TILE}" viewBox="{vb}">{body}</svg>')
        label = f'{sname}: {cname.strip()}' + (' (по умолч.)' if is_def else '')
        out.append(f'<text x="{x + TILE / 2}" y="{y + TILE + 24}" text-anchor="middle" '
                   f'font-family="DejaVu Sans, Arial, sans-serif" font-size="19" fill="#222">{label}</text>')
    return W, H, '\n'.join(out)


def export(src):
    name = os.path.splitext(os.path.basename(src))[0]
    with zipfile.ZipFile(src) as z:
        doc = json.loads(z.read('Project.mohoproj').decode('utf-8'))
    cv = Canvas(doc)
    tex = Textures(src)
    items, skel = collect(doc)

    def draw(i, it):
        overlay = ''.join(tex.use(img, im, cv) for img, im in it['overlay'])
        return mesh_svg(it['layer'], it['matrix'], cv, overlay, str(i))

    # 1) геометрия всех слоёв в пикселях кадра Moho; пустые слои не нужны
    for i, it in enumerate(items):
        it['svg'], it['bbox'] = draw(i, it)
    for it in items:
        if not it['svg']:
            print(f'  пустой слой пропущен: {"/".join(it["path"])}')
    items = [it for it in items if it['svg']]
    x0 = math.floor(min(it['bbox'][0] for it in items)) - PAD
    y0 = math.floor(min(it['bbox'][1] for it in items)) - PAD
    x1 = math.ceil(max(it['bbox'][2] for it in items)) + PAD
    y1 = math.ceil(max(it['bbox'][3] for it in items)) + PAD

    # 2) холст персонажа = рамка всех слоёв (включая все рты/глаза) + поля
    cv.dx, cv.dy = x0, y0
    cw, chh = x1 - x0, y1 - y0
    for i, it in enumerate(items):
        it['svg'], it['bbox'] = draw(i, it)

    out = os.path.join(OUT_DIR, slug(name))
    svg_dir = os.path.join(out, 'svg')
    os.makedirs(svg_dir, exist_ok=True)
    for f in os.listdir(svg_dir):
        if f.endswith('.svg'):
            os.remove(os.path.join(svg_dir, f))

    bones = bone_records(skel, cv)
    pivots = {b['name']: b['base'] for b in bones}
    dials = set(pivots)

    # 3) слои: порядок отрисовки, файлы, привязка к костям
    layers_out, switches = [], []
    recs = []
    order, last_sw, used = 0, None, set()
    for it in items:
        L, sw = it['layer'], it['switch']
        if sw is None or sw is not last_sw:
            order += 1
        last_sw = sw
        base = f'{order:02d}-' + (f'{slug(sw["layer"]["name"])}--{slug(L["name"])}' if sw else slug(L['name']))
        fn, k = base, 2
        while fn in used:
            fn, k = f'{base}-{k}', k + 1
        used.add(fn)
        kind, bone, extra = binding(L, sw, bones)
        rec = {'order': order, 'name': L['name'], 'png': f'png/{fn}.png', 'svg': f'svg/{fn}.svg',
               'bbox': [round(v, 1) for v in it['bbox']], 'binding': kind, 'bone': bone}
        if bone:
            rec['pivot'] = pivots[bone]
            next(b for b in bones if b['name'] == bone)['drives'].append(
                f'{sw["layer"]["name"]}/{L["name"]}' if sw else L['name'])
        rec.update(extra)
        with open(os.path.join(svg_dir, fn + '.svg'), 'w', encoding='utf-8') as f:
            f.write(svg_doc(cw, chh, '\n'.join(it['svg']), f'{name} / {"/".join(it["path"])}', tex))
        if sw:
            if not switches or switches[-1]['_src'] is not sw:
                sk = sw['layer']['switch_keys']
                dial = next((a for a in sk.get('actions', []) if a['name'] in dials), None)
                switches.append({'_src': sw, 'name': sw['layer']['name'], 'order': order,
                                 'default': val(sk), 'children': []})
                if dial:
                    # умная кость-«диск»: поворот кости выбирает вариант (кадр действия -> вариант)
                    switches[-1]['smart_bone'] = dial['name']
                    switches[-1]['smart_bone_frames'] = {v: w for w, v in zip(dial['pose']['when'], dial['pose']['val'])}
            switches[-1]['children'].append(rec)
            recs.append({'rec': rec, 'switch': switches[-1], 'svg': it['svg']})
        else:
            layers_out.append(rec)
            recs.append({'rec': rec, 'switch': None, 'svg': it['svg']})

    # 4) превью: как в Moho на кадре 0 (варианты по умолчанию), то же с костями, лист вариантов
    bg = '#%02x%02x%02x' % tuple(doc['project_data']['back_color'][c] for c in 'rgb')
    shown = ''.join(''.join(r['svg']) for r in recs
                    if r['switch'] is None or r['rec']['name'] == r['switch']['default'])
    with open(os.path.join(out, 'preview.svg'), 'w', encoding='utf-8') as f:
        f.write(svg_doc(cw, chh, f'<rect width="{cw}" height="{chh}" fill="{bg}"/>' + shown, name, tex))
    with open(os.path.join(out, 'bones.svg'), 'w', encoding='utf-8') as f:
        f.write(svg_doc(cw, chh, f'<rect width="{cw}" height="{chh}" fill="{bg}"/>'
                        f'<g opacity=".55">{shown}</g>' + bones_svg(bones), name + ' — кости', tex))
    var = variants_svg(switches, recs, bg)
    if var:
        with open(os.path.join(out, 'variants.svg'), 'w', encoding='utf-8') as f:
            f.write(svg_doc(var[0], var[1], var[2], name + ' — варианты switch-слоёв', tex))
    elif os.path.exists(os.path.join(out, 'variants.svg')):
        os.remove(os.path.join(out, 'variants.svg'))

    for sw in switches:
        del sw['_src']
    rig = {
        'name': name,
        'source': os.path.relpath(src, ROOT),
        'canvas': {'width': cw, 'height': chh},
        'moho_frame': {
            'width': cv.W, 'height': cv.H, 'offset': [x0, y0],
            'note': 'пиксель кадра Moho = пиксель холста + offset; 1 единица Moho = %g px' % cv.k,
        },
        'bones': bones,
        'layers': layers_out,
        'switches': switches,
    }
    with open(os.path.join(out, 'rig.json'), 'w', encoding='utf-8') as f:
        json.dump(rig, f, ensure_ascii=False, indent=1)
    print(f'{os.path.relpath(out, ROOT)}/  {cw}x{chh}  слоёв: {len(items)}  костей: {len(bones)}')
    return out


def main(args):
    srcs = args or sorted(os.path.join(SRC_DIR, f) for f in os.listdir(SRC_DIR) if f.endswith('.moho'))
    for src in srcs:
        export(src)


if __name__ == '__main__':
    main(sys.argv[1:])
