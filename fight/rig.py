"""Перекладка персонажей из ригов Moho.

Каждый слой рига привязан к «кости» — точке вращения в центре кругляша,
который автор нарисовал на конце части. Поза задаётся словарём; всё в
локальных координатах рига (единицы Moho, y вниз, персонаж смотрит вправо).
Разворот влево — зеркалирование всего персонажа.

Ноги считаются через IK: задаётся положение щиколотки, колено всегда
сгибается вперёд — туда, куда смотрят носки.
"""
import math
import os

import cairo

import moho
from fx import heart

RIGS = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'rigs')
GROUND_Y = 945          # ступни на ~88 % высоты кадра
BIG_PX = 820            # рост любого большого персонажа
BALL_PX = 300           # диаметр шарика


def _rot_about(m, p, deg):
    """m · T(p) · R(deg) · T(−p)."""
    if not deg:
        return m
    r = cairo.Matrix()
    r.translate(*p)
    r.rotate(math.radians(deg))
    r.translate(-p[0], -p[1])
    return r.multiply(m)


def _mul(parent, local):
    """Матрица дочерней кости: сначала локальное, потом родительское."""
    return local.multiply(parent)


def _ang(v):
    return math.degrees(math.atan2(v[1], v[0]))


def _sub(a, b):
    return (a[0] - b[0], a[1] - b[1])


def _add(a, b):
    return (a[0] + b[0], a[1] + b[1])


def _len(v):
    return math.hypot(v[0], v[1])


def two_bone(root, mid0, end0, target, bend):
    """IK на две кости. bend=+1 — средний сустав уходит в сторону +x (вперёд),
    bend=−1 — назад. Возвращает (поворот первой кости, поворот второй
    относительно первой) в градусах и точку сустава."""
    l1, l2 = _len(_sub(mid0, root)), _len(_sub(end0, mid0))
    d = _sub(target, root)
    dist = min(max(_len(d), abs(l1 - l2) + 1e-4), l1 + l2 - 1e-4)
    phi = math.atan2(d[1], d[0])
    a = math.acos(max(-1.0, min(1.0, (l1 * l1 + dist * dist - l2 * l2) / (2 * l1 * dist))))
    # при направлении «вниз» уменьшение угла уводит сустав в +x
    cand = [phi - a, phi + a]
    joints = [(root[0] + l1 * math.cos(c), root[1] + l1 * math.sin(c)) for c in cand]
    # выбрать сустав с нужной стороны от линии root→target
    def side(j):
        return (d[0] * (j[1] - root[1]) - d[1] * (j[0] - root[0]))
    # для ноги, идущей вниз, сустав впереди (+x) даёт side < 0
    j = joints[0] if (side(joints[0]) < 0) == (bend > 0) else joints[1]
    end = (root[0] + d[0] / max(_len(d), 1e-9) * dist, root[1] + d[1] / max(_len(d), 1e-9) * dist)
    a1 = _ang(_sub(j, root)) - _ang(_sub(mid0, root))
    a2 = _ang(_sub(end, j)) - _ang(_sub(end0, mid0)) - a1
    return a1, a2, j


def _wrap(a):
    while a > 180:
        a -= 360
    while a < -180:
        a += 360
    return a


# --------------------------------------------------------------------- описания ригов
# Кости: имя → (родитель, точка вращения). Слои: имя слоя → кость.
# «F» — дальняя рука/нога (со стороны взгляда, за телом),
# «N» — ближняя к зрителю (перед телом).
LORD_BIG = dict(
    file='lord_verity_big.moho',
    top=-0.987, sole=0.985, mid_x=-0.01,
    bones={
        'torso': ('root', (0.0, 0.16)),
        'head': ('torso', (0.01, -0.44)),
        'face': ('head', (0.01, -0.66)),
        'hat': ('head', (0.0, -0.85)),
        'F1': ('torso', (0.162, -0.29)), 'F2': ('F1', (0.202, 0.015)), 'F3': ('F2', (0.226, 0.235)),
        'N1': ('torso', (-0.215, -0.295)), 'N2': ('N1', (-0.262, -0.025)), 'N3': ('N2', (-0.25, 0.265)),
        'FL1': ('root', (0.070, 0.131)), 'FL2': ('FL1', (0.081, 0.552)), 'FL3': ('FL2', (0.079, 0.81)),
        'NL1': ('root', (-0.073, 0.151)), 'NL2': ('NL1', (-0.083, 0.548)), 'NL3': ('NL2', (-0.095, 0.85)),
        'pelvis': ('root', (0.0, 0.16)),
    },
    layers={
        'hand left 1': 'F1', 'hand left 2': 'F2', 'hand left 3': 'F3',
        'hand right 1': 'N1', 'hand right 2': 'N2', 'hand right 3': 'N3',
        'leg left 1': 'FL1', 'leg left 2': 'FL2', 'leg left 3': 'FL3',
        'leg right 1': 'NL1', 'leg right 2': 'NL2', 'leg right 3': 'NL3',
        'hip': 'pelvis', 'neck': 'torso', 'body': 'torso',
        'head': 'head', 'mouth': 'face', 'eye': 'face', 'hat': 'hat',
    },
    eye_layer='eye', mouth_layer='mouth', eye_c=(0.03, -0.73), mouth_c=(0.02, -0.56),
    eye_pts=[(-0.055, -0.728), (0.118, -0.73)], cheeks=[(-0.13, -0.60), (0.17, -0.60)], heart_r=0.075,
)

SKELETON_BIG = dict(
    file='skeleton_verity_big.moho',
    top=-0.832, sole=0.880, mid_x=0.05,
    bones={
        'torso': ('root', (0.02, 0.10)),
        'head': ('torso', (0.06, -0.33)),
        'face': ('head', (0.12, -0.60)),
        'F1': ('torso', (0.165, -0.235)), 'F2': ('F1', (0.228, 0.088)), 'F3': ('F2', (0.24, 0.378)),
        'N1': ('torso', (-0.135, -0.235)), 'N2': ('N1', (-0.19, 0.09)), 'N3': ('N2', (-0.18, 0.39)),
        'FL1': ('root', (0.107, 0.225)), 'FL2': ('FL1', (0.155, 0.468)), 'FL3': ('FL2', (0.104, 0.738)),
        'NL1': ('root', (-0.071, 0.243)), 'NL2': ('NL1', (-0.034, 0.498)), 'NL3': ('NL2', (-0.09, 0.786)),
        'pelvis': ('root', (0.02, 0.10)),
        'WN': ('torso', (-0.03, -0.19)), 'WF': ('torso', (0.07, -0.19)),
    },
    layers={
        'hand left 1': 'F1', 'hand left 2': 'F2', 'hand left 3': 'F3',
        'hand right 1': 'N1', 'hand right 2': 'N2', 'hand right 3': 'N3',
        'leg left 1': 'FL1', 'leg left 2': 'FL2', 'leg left 3': 'FL3',
        'leg right 1': 'NL1', 'leg right 2': 'NL2', 'leg right 3': 'NL3',
        'hip': 'pelvis', 'body': 'torso', 'neck': 'torso',
        'head': 'head', 'mouth': 'face', 'eye': 'face',
        'wing 1': 'WN', 'wing 2': 'WF',
    },
    eye_layer='eye', mouth_layer='mouth', eye_c=(0.14, -0.67), mouth_c=(0.12, -0.50),
    eye_pts=[(0.059, -0.665), (0.22, -0.67)], cheeks=[(-0.02, -0.57), (0.28, -0.57)], heart_r=0.07,
)

GIRL_BIG = dict(
    file='girl_verity_big.moho',
    top=-0.996, sole=0.986, mid_x=-0.07, face_shift=0.0,
    bones={
        'torso': ('root', (-0.07, 0.15)),
        'head': ('torso', (-0.07, -0.42)),
        'face': ('head', (0.0, -0.60)),
        'F1': ('torso', (0.047, -0.231)), 'F2': ('F1', (0.175, 0.032)), 'F3': ('F2', (0.215, 0.28)),
        'N1': ('torso', (-0.205, -0.234)), 'N2': ('N1', (-0.319, 0.035)), 'N3': ('N2', (-0.36, 0.28)),
        'FL1': ('root', (-0.009, 0.302)), 'FL2': ('FL1', (0.002, 0.671)), 'FL3': ('FL2', (0.0, 0.90)),
        'NL1': ('root', (-0.133, 0.302)), 'NL2': ('NL1', (-0.139, 0.671)), 'NL3': ('NL2', (-0.14, 0.90)),
        'pelvis': ('root', (-0.07, 0.15)),
    },
    layers={
        'hand left 1': 'F1', 'hand left 2': 'F2', 'hand right 1': 'N1', 'hand right 2': 'N2',
        'leg left 1': 'FL1', 'leg left 2': 'FL2', 'leg right 1': 'NL1', 'leg right 2': 'NL2',
        'body': 'torso', 'skirt': 'pelvis', 'head': 'head', 'bow': 'head',
    },
    switch_bone={'eyes': 'face', 'mouth': 'face'},
    switch_default={'eyes': 'normal', 'mouth': 'smile normal'},
    # ботинок — одна деталь с голенью: режем по щиколотке
    splits={'leg left 2': ('FL3', 0.885), 'leg right 2': ('NL3', 0.885)},
    eye_layers=(), mouth_layers=(), eye_c=(0.02, -0.645), mouth_c=(0.0, -0.50),
    eye_pts=[(-0.065, -0.645), (0.10, -0.645)], cheeks=[(-0.14, -0.55), (0.17, -0.55)], heart_r=0.055,
)

# Ла Пис нарисован лицом влево — зеркалим, чтобы, как все, смотрел вправо.
# Он меньше больших, но больше шариков; ног нет — парит над землёй.
LA_PEACE = dict(
    file='la_peace.moho', mirror=True, px=500,
    top=-0.967, sole=0.989, mid_x=-0.04, face_shift=0.0,
    bones={
        'torso': ('root', (0.0, 0.30)),
        'head': ('torso', (0.04, -0.22)),
        'face': ('head', (0.04, -0.50)),
        'F1': ('torso', (0.13, -0.12)), 'F2': ('F1', (0.188, 0.111)), 'F3': ('F2', (0.252, 0.391)),
        'N1': ('torso', (-0.25, -0.12)), 'N2': ('N1', (-0.305, 0.111)), 'N3': ('N2', (-0.344, 0.398)),
        'pelvis': ('root', (0.0, 0.30)),
    },
    layers={
        'hand right 1': 'F1', 'hand right 2': 'F2', 'hand left 1': 'N1', 'hand left 2': 'N2',
        'body': 'torso', 'hair behind': 'head', 'hair front 2': 'head', 'head': 'head',
        'hair front': 'head', 'ear': 'head', 'bread': 'head',
        'eye brows': 'face', 'pupils': 'face', ' eyelids': 'face',
    },
    switch_bone={'mouth': 'face'},
    switch_default={'mouth': 'mouth smile'},
    eye_layers=('pupils', ' eyelids'), mouth_layers=(), eye_c=(0.14, -0.50), mouth_c=(0.15, -0.34),
    eye_pts=[(0.30, -0.49), (-0.013, -0.49)], cheeks=[(0.36, -0.40), (-0.06, -0.40)], heart_r=0.075,
)

BALLS = {
    'lord_small': 'lord_verity_small.moho',
    'skeleton_small': 'skeleton_verity_small.moho',
    'girl_small': 'girl_verity_small.moho',
    'child': 'child_verity_pink.moho',
    'fat': 'fat_verity_small.moho',
}


# --------------------------------------------------------------------- рисование слоя
def draw_layer(ctx, layer, alpha=1.0):
    for s in layer.shapes:
        if s.has_fill and s.loops:
            ctx.new_path()
            for loop in s.loops:
                ctx.move_to(*loop[0][0])
                for seg in loop:
                    ctx.curve_to(*seg[1], *seg[2], *seg[3])
                ctx.close_path()
            r, g, b, a = s.fill
            ctx.set_source_rgba(r, g, b, a * alpha)
            ctx.set_fill_rule(cairo.FILL_RULE_EVEN_ODD)
            ctx.fill()
        if s.has_outline and s.strokes:
            r, g, b, a = s.line
            ctx.set_source_rgba(r, g, b, a * alpha)
            ctx.set_line_cap(cairo.LINE_CAP_ROUND)
            ctx.set_line_join(cairo.LINE_JOIN_ROUND)
            # соседние сегменты одной толщины — одним путём, чтобы стыки были гладкими
            run, w0 = [], None
            for seg, w in s.strokes + [(None, None)]:
                if run and (seg is None or w != w0 or seg[0] != run[-1][3]):
                    ctx.new_path()
                    ctx.move_to(*run[0][0])
                    for g_ in run:
                        ctx.curve_to(*g_[1], *g_[2], *g_[3])
                    ctx.set_line_width(s.width * w0)
                    ctx.stroke()
                    run = []
                if seg is not None:
                    run.append(seg)
                    w0 = w


# --------------------------------------------------------------------- большой персонаж
class Big:
    def __init__(self, spec):
        self.spec = spec
        self.layers = moho.load(os.path.join(RIGS, spec['file']))
        if spec.get('mirror'):
            moho.mirror(self.layers)
        self.k = spec.get('px', BIG_PX) / (spec['sole'] - spec['top'])   # px на единицу
        self.bones = spec['bones']
        self.eye_layers = set(spec.get('eye_layers', (spec.get('eye_layer'),)))
        self.mouth_layers = set(spec.get('mouth_layers', (spec.get('mouth_layer'),)))

    # точки рига
    def P(self, b):
        return self.bones[b][1]

    def matrices(self, pose):
        """Матрицы костей в локальных координатах рига (до установки в кадр)."""
        M = {'root': cairo.Matrix()}
        hx, hy = pose.get('hip', (0.0, 0.0))
        pel = cairo.Matrix(x0=hx, y0=hy)
        M['pelvis'] = pel
        torso = _rot_about(cairo.Matrix(), self.P('torso'), pose.get('lean', 0.0)).multiply(pel)
        M['torso'] = torso
        head = _rot_about(cairo.Matrix(), self.P('head'), pose.get('head', 0.0)).multiply(torso)
        M['head'] = head
        fs = pose.get('face_shift', self.spec.get('face_shift', 0.035))
        face = cairo.Matrix(x0=fs, y0=0.0).multiply(head)
        M['face'] = face
        if 'hat' in self.bones:
            M['hat'] = head
        # руки: углы (плечо, локоть, кисть) — «вперёд» положительно
        for side in ('F', 'N'):
            if side + '1' not in self.bones:
                continue
            arm = pose.get('arm' + side, (0.0, 0.0, 0.0))
            if isinstance(arm, dict):          # IK: {'to': (x, y) в координатах рига, 'bend': ±1, 'wrist': deg}
                tgt = arm['to']
                # перевести цель в пространство туловища
                inv = cairo.Matrix(*torso)
                inv.invert()
                tl = inv.transform_point(*tgt)
                a1, a2, _ = two_bone(self.P(side + '1'), self.P(side + '2'), self.P(side + '3'),
                                     tl, arm.get('bend', -1))
                angs = (a1, a2, arm.get('wrist', 0.0))
            else:
                angs = (-arm[0], -arm[1], -arm[2])
            m1 = _rot_about(cairo.Matrix(), self.P(side + '1'), angs[0]).multiply(torso)
            m2 = _rot_about(cairo.Matrix(), self.P(side + '2'), angs[1]).multiply(m1)
            m3 = _rot_about(cairo.Matrix(), self.P(side + '3'), angs[2]).multiply(m2)
            M[side + '1'], M[side + '2'], M[side + '3'] = m1, m2, m3
        # ноги: IK от бедра (сдвинутого вместе с тазом) к щиколотке
        for side in ('F', 'N'):
            if side + 'L1' not in self.bones:
                continue          # без ног (Ла Пис парит)
            off = pose.get('foot' + side, (0.0, 0.0))
            frot = pose.get('foot' + side + 'rot', 0.0)
            H0, K0, A0 = self.P(side + 'L1'), self.P(side + 'L2'), self.P(side + 'L3')
            H = (H0[0] + hx, H0[1] + hy)
            A = (A0[0] + off[0], A0[1] + off[1])
            # IK считается для кости, начинающейся в H; сдвигаем точки покоя в H
            K0s, A0s = (K0[0] + hx, K0[1] + hy), (A0[0] + hx, A0[1] + hy)
            a1, a2, _ = two_bone(H, K0s, A0s, A, pose.get('knee' + side, 1))
            m1 = _rot_about(cairo.Matrix(), H0, a1).multiply(pel)
            m2 = _rot_about(cairo.Matrix(), K0, a2).multiply(m1)
            m3 = _rot_about(cairo.Matrix(), A0, frot - a1 - a2).multiply(m2)
            M[side + 'L1'], M[side + 'L2'], M[side + 'L3'] = m1, m2, m3
        # крылья: 0 — раскрыты как в риге; положительный угол — вверх
        if 'WN' in self.bones:
            w = pose.get('wings', 0.0)
            wn = pose.get('wingN', w)
            wf = pose.get('wingF', w)
            M['WN'] = _rot_about(cairo.Matrix(), self.P('WN'), wn).multiply(torso)
            M['WF'] = _rot_about(cairo.Matrix(), self.P('WF'), -wf).multiply(torso)
        return M

    def place(self, pose):
        """Матрица установки в кадр: от координат рига к пикселям."""
        sp = self.spec
        s = self.k * pose.get('scale', 1.0)
        d = pose.get('dir', 1)
        m = cairo.Matrix()
        m.translate(pose['x'], pose.get('y', GROUND_Y))
        if pose.get('rot'):
            # вращение всего тела вокруг центра (кувырок, улёт)
            cy = -(sp['sole'] - sp['top']) * 0.5 * s
            m.translate(0, cy)
            m.rotate(math.radians(pose['rot']) * d)
            m.translate(0, -cy)
        m.scale(d * s * pose.get('sx', 1.0), s * pose.get('sy', 1.0))
        m.translate(-sp['mid_x'], -sp['sole'])
        return m

    def arm_ik(self, pose, side, target, tip=None, bend=-1, wrist=0.0, iters=5):
        """Углы руки (как в позе, «вперёд» положительно), при которых точка tip
        кисти (по умолчанию запястье) попадает ровно в точку кадра target."""
        M = self.matrices(dict(pose, **{'arm' + side: (0.0, 0.0, 0.0)}))
        inv = cairo.Matrix(*M['torso'])
        inv.invert()
        goal = inv.transform_point(*self.to_local(pose, target))
        P1, P2, P3 = self.P(side + '1'), self.P(side + '2'), self.P(side + '3')
        tip = tip or P3
        wr = goal
        for _ in range(iters):
            a1, a2, _ = two_bone(P1, P2, P3, wr, bend)
            m1 = _rot_about(cairo.Matrix(), P1, a1)
            m2 = _rot_about(cairo.Matrix(), P2, a2).multiply(m1)
            m3 = _rot_about(cairo.Matrix(), P3, -wrist).multiply(m2)
            t = m3.transform_point(*tip)
            wr = (wr[0] + goal[0] - t[0], wr[1] + goal[1] - t[1])
        return (-_wrap(a1), -_wrap(a2), wrist)

    def joint(self, pose, bone, p=None):
        """Точка кости в кадре (по умолчанию — её точка вращения)."""
        M = self.matrices(pose)
        q = M[bone].transform_point(*(p or self.P(bone)))
        return self.place(pose).transform_point(*q)

    def to_local(self, pose, pt):
        """Пиксели кадра → координаты рига (для IK по точке в кадре)."""
        m = self.place(pose)
        m.invert()
        return m.transform_point(*pt)

    def draw_hat(self, ctx, x, y, rot=0.0, d=1, scale=1.0):
        """Шляпа отдельно от головы (слетела, брошена): центр в (x, y)."""
        piv = self.bones['hat'][1]
        ctx.save()
        ctx.translate(x, y)
        ctx.rotate(math.radians(rot))
        ctx.scale(d * self.k * scale, self.k * scale)
        ctx.translate(-piv[0], -piv[1])
        draw_layer(ctx, self.hat_layer())
        ctx.restore()

    def world_point(self, pose, bone, p):
        """Точка рига p (на кости bone) в пикселях кадра."""
        M = self.matrices(pose)
        q = M[bone].transform_point(*p)
        return self.place(pose).transform_point(*q)

    def draw(self, ctx, pose):
        M = self.matrices(pose)
        place = self.place(pose)
        sp = self.spec
        hide = pose.get('hide', ())
        only = pose.get('only')
        alpha = pose.get('alpha', 1.0)
        hearts = pose.get('hearts', 0.0)
        extras = pose.get('blush', 0.0) or hearts
        extras_done = False
        for L in self.layers:
            if L.switch:
                if L.name != pose.get('sw_' + L.switch, sp['switch_default'][L.switch]):
                    continue
                b = sp['switch_bone'][L.switch]
            else:
                b = sp['layers'].get(L.name)
            if b is None or L.name in hide or not L.shapes:
                continue
            if only is not None and L.name not in only:
                continue
            is_eye = L.name in self.eye_layers or L.switch == 'eyes'
            is_mouth = L.name in self.mouth_layers or L.switch == 'mouth'
            if is_eye and extras and not extras_done:
                # румянец и глаза‑сердечки рисуются на месте глаз
                self._face_extras(ctx, place, M['face'], hearts, pose.get('blush', 0.0), alpha)
                extras_done = True
            if is_eye and hearts:
                continue
            ctx.save()
            ctx.transform(place)
            ctx.transform(M[b])
            if is_eye:
                self._scale_about(ctx, sp['eye_c'], pose.get('eyes', (1.0, 1.0)))
            elif is_mouth:
                self._scale_about(ctx, sp['mouth_c'], pose.get('mouth', (1.0, 1.0)))
            elif L.name == 'head' and pose.get('head_sx'):
                self._scale_about(ctx, (0.0, -0.66), (pose['head_sx'], 1.0))
            split = sp.get('splits', {}).get(L.name)
            if split:
                # цельная голень с ботинком: стопа держит свой поворот, подошва ровная
                foot, cut = split
                ctx.restore()
                ctx.save()
                ctx.transform(place)
                ctx.transform(M[foot])
                ctx.rectangle(-5, cut - 0.015, 10, 5)
                ctx.clip()
                draw_layer(ctx, L, alpha)
                ctx.restore()
                ctx.save()
                ctx.transform(place)
                ctx.transform(M[b])
                ctx.rectangle(-5, -5, 10, cut + 0.02 + 5)
                ctx.clip()
            draw_layer(ctx, L, alpha)
            ctx.restore()

    def _face_extras(self, ctx, place, face, hearts, blush, alpha):
        sp = self.spec
        ctx.save()
        ctx.transform(place)
        ctx.transform(face)
        if blush:
            for cx, cy in sp['cheeks']:
                ctx.save()
                ctx.translate(cx, cy)
                ctx.scale(sp['heart_r'] * 1.5, sp['heart_r'] * 0.8)
                ctx.arc(0, 0, 1, 0, 2 * math.pi)
                ctx.restore()
                ctx.set_source_rgba(1.0, 0.35, 0.45, 0.55 * blush * alpha)
                ctx.fill()
        if hearts:
            for cx, cy in sp['eye_pts']:
                heart(ctx, cx, cy, sp['heart_r'] * hearts, alpha, lw=0.012)
        ctx.restore()

    @staticmethod
    def _scale_about(ctx, c, s):
        if s == (1.0, 1.0):
            return
        ctx.translate(*c)
        ctx.scale(*s)
        ctx.translate(-c[0], -c[1])

    def hat_layer(self):
        return next(l for l in self.layers if l.name == 'hat')


# --------------------------------------------------------------------- шарики
BALL_W = {'fat': 530}     # толстый шире шарика: ~530 × 460 px


class Ball:
    """Маленький персонаж: тело, переключатели глаз и рта, шляпа."""

    def __init__(self, key):
        self.layers = moho.load(os.path.join(RIGS, BALLS[key]))
        body = next(l for l in self.layers if l.name == 'body')
        x0, y0, x1, y1 = body.bbox()
        self.cx, self.bottom = (x0 + x1) / 2, y1
        self.h = y1 - y0
        self.k = BALL_W[key] / (x1 - x0) if key in BALL_W else BALL_PX / max(x1 - x0, y1 - y0)
        self.center_y = (y0 + y1) / 2
        self.prop = None
        if key == 'child':
            # шапка с пропеллером: лопасти (фигуры 6 и 8) и пятачок (7) рисуются отдельно
            hat = next(l for l in self.layers if l.name == 'hat')
            hub = hat.shapes[7]
            xs = [p[0] for loop in hub.loops for g in loop for p in g]
            self.prop = (moho.Layer('hat', hat.shapes[:6]),
                         moho.Layer('blades', [hat.shapes[6], hat.shapes[8]]),
                         moho.Layer('hub', [hub]), (min(xs) + max(xs)) / 2)
        mouths = [l for l in self.layers if l.switch == 'mouth']
        self.mouth_c = {}
        for m in mouths:
            a, b, c, d = m.bbox()
            self.mouth_c[m.name] = ((a + c) / 2, (b + d) / 2)

    def place(self, pose):
        s = self.k * pose.get('scale', 1.0)
        d = pose.get('dir', 1)
        m = cairo.Matrix()
        m.translate(pose['x'], pose.get('y', GROUND_Y))
        # сквош от точки опоры
        m.scale(pose.get('sx', 1.0), pose.get('sy', 1.0))
        if pose.get('rot'):
            cy = -self.h * 0.5 * s
            m.translate(0, cy)
            m.rotate(math.radians(pose['rot']) * d)
            m.translate(0, -cy)
        m.scale(d * s, s)
        m.translate(-self.cx, -self.bottom)
        return m

    def draw(self, ctx, pose):
        place = self.place(pose)
        eyes = pose.get('eyes', 'normal')
        mouth = pose.get('mouth', 'smile normal')
        fs = pose.get('face_shift', 0.05)
        hide = pose.get('hide', ())
        alpha = pose.get('alpha', 1.0)
        for L in self.layers:
            if L.switch == 'eyes' and L.name != eyes:
                continue
            if L.switch == 'mouth' and L.name != mouth:
                continue
            if L.name in hide:
                continue
            ctx.save()
            ctx.transform(place)
            if L.switch in ('eyes', 'mouth') or L.name in ('mouth', 'blush'):
                if abs(fs) > 0.03:
                    # черты лица не вылезают за контур тела
                    self._loops_path(ctx, self.layer('body'))
                    ctx.clip()
                self._face_xf(ctx, fs, eyes=L.switch == 'eyes')
                if L.switch == 'eyes':
                    ctx.translate(0, pose.get('eye_dy', 0.0))
                    if pose.get('eye_s'):
                        c = (self.cx + 0.0, self.center_y - 0.08)
                        ctx.translate(*c)
                        ctx.scale(*pose['eye_s'])
                        ctx.translate(-c[0], -c[1])
                if L.switch == 'mouth':
                    self._mouth_xf(ctx, L.name, pose)
                if L.name == 'mouth' and pose.get('mouth_s'):
                    a, b, c, d = L.bbox()
                    ms = pose['mouth_s']
                    ctx.translate((a + c) / 2, b)
                    ctx.scale(ms[0], ms[1])
                    ctx.translate(-(a + c) / 2, -b)
            if L.name == 'hat' and self.prop:
                self._draw_prop_hat(ctx, pose, alpha)
                ctx.restore()
                continue
            draw_layer(ctx, L, alpha)
            ctx.restore()

    def _draw_prop_hat(self, ctx, pose, alpha):
        """Шапка с пропеллером: лопасти крутятся (сжатие по ширине), в полёте — размыто."""
        static, blades, hub, hx = self.prop
        draw_layer(ctx, static, alpha)
        a = pose.get('prop', 0.0)
        ghosts = ((0, 1.0), (-28, 0.45), (-56, 0.25)) if pose.get('prop_blur') else ((0, 1.0),)
        for da, al in ghosts:
            c = math.cos(math.radians(a + da))
            c = math.copysign(max(abs(c), 0.06), c)
            ctx.save()
            ctx.translate(hx, 0)
            ctx.scale(c, 1)
            ctx.translate(-hx, 0)
            draw_layer(ctx, blades, alpha * al)
            ctx.restore()
        draw_layer(ctx, hub, alpha)

    def layer_center(self, name):
        a, b, c, d = self.layer(name).bbox()
        return (a + c) / 2, (b + d) / 2

    def draw_layer_at(self, ctx, name, x, y, rot=0.0, d=1, scale=1.0):
        """Слой рига отдельно от персонажа (слетевшая шляпа): центр слоя в (x, y)."""
        c = self.layer_center(name)
        ctx.save()
        ctx.translate(x, y)
        ctx.rotate(math.radians(rot))
        ctx.scale(d * self.k * scale, self.k * scale)
        ctx.translate(-c[0], -c[1])
        draw_layer(ctx, self.layer(name))
        ctx.restore()

    def _face_xf(self, ctx, fs, eyes=False):
        """Поворот лица в три четверти: черты сдвинуты к взгляду, лицо сужено,
        глаза сдвинуты чуть сильнее рта."""
        sq = 1.0 - min(0.18, 1.3 * abs(fs))
        ctx.translate(self.cx + fs * (1.3 if eyes else 1.0), 0)
        ctx.scale(sq, 1)
        ctx.translate(-self.cx, 0)

    def _mouth_xf(self, ctx, name, pose):
        """Огромный рот: масштаб вокруг центра рта и сдвиг (в единицах рига)."""
        ms = pose.get('mouth_s')
        if not ms:
            return
        c = self.mouth_c[name]
        dx, dy = pose.get('mouth_off', (0.0, 0.0))
        ctx.translate(c[0] + dx, c[1] + dy)
        ctx.scale(ms[0], ms[1])
        ctx.translate(-c[0], -c[1])

    def _loops_path(self, ctx, layer, shape=0):
        for loop in layer.shapes[shape].loops:
            ctx.move_to(*loop[0][0])
            for g in loop:
                ctx.curve_to(*g[1], *g[2], *g[3])
            ctx.close_path()

    def swallow_clip(self, ctx, pose, w=1920, h=1080, pad=400):
        """Обрезка для того, что попадает в рот: видно всё вне тела и внутри рта."""
        mouth = self.layer(pose.get('mouth', 'smile normal'))
        ctx.new_path()
        ctx.rectangle(-pad, -pad, w + 2 * pad, h + 2 * pad)
        ctx.save()
        ctx.transform(self.place(pose))
        self._loops_path(ctx, self.layer('body'))
        self._face_xf(ctx, pose.get('face_shift', 0.05))
        self._mouth_xf(ctx, mouth.name, pose)
        self._loops_path(ctx, mouth)
        ctx.restore()
        ctx.set_fill_rule(cairo.FILL_RULE_EVEN_ODD)
        ctx.clip()

    def point(self, pose, p, face=False):
        """Точка рига в кадре; face=True — с учётом сдвига лица."""
        m = self.place(pose)
        x = p[0]
        if face:
            fs = pose.get('face_shift', 0.05)
            x = self.cx + fs + (1.0 - min(0.18, 1.3 * abs(fs))) * (x - self.cx)
        return m.transform_point(x, p[1])

    def layer(self, name):
        return next(l for l in self.layers if l.name == name and l.switch != 'eyes')
