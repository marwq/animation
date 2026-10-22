"""Розовая против Ла Писа — и все в неё влюбились. Луг, день. 25 с = 600 кадров.

 0–3 с      розовая-шарик стоит, Ла Пис подплывает к ней и самодовольно гладит бороду
 3–6 с      розовая прыгает на него лбом — Ла Пис встречает её ладонью, она отлетает
 6–9 с      раскручивается и катится на него — низкий шлепок, она взлетает и падает блином
 9–11 с     злится → ухмылка, лучи → дым → большая розовая
 11–14 с    воздушный поцелуй — Ла Пис влюбляется; справа прибегает лорд,
            из угла пикирует скелет — оба влюблены
 14–16.5 с  скелет отталкивает лорда, лорд разворачивается и бьёт — скелет улетает вправо
 16.5–19 с  лорд отпихивает Ла Писа, тот разворачивается и ладонью снизу
            отправляет лорда вверх за кадр
 19–21.5 с  Ла Пис плывёт к розовой с сердечками — пощёчина, и он улетает вдаль
 21.5–25 с  розовая одна выходит в центр, руки на бёдра, воздушный поцелуй зрителю
"""
import math
import random

import bg
import fx
from anim import Camera, ball_squash, hop, lerp, pose_keys, seg, walk
from fx import ease_in, ease_io, ease_out
from rig import GIRL_BIG, GROUND_Y as G, LA_PEACE, LORD_BIG, SKELETON_BIG, Ball, Big

GB_X = 470                      # розовая: шарик и большая
LP_X0, LP_X = 2150, 1000        # Ла Пис подплывает справа
HOV = 14                        # Ла Пис парит над землёй
LP2, LD_X, SK_X = 800, 1120, 1545   # поклонники в ряд
LD2, LP3 = 1075, 830            # лорд шагнул к Ла Пису; Ла Пис подлетел к лорду
CENTER = 960

TIP_LP = (0.252, 0.50)          # кончик кисти Ла Писа (рука F)
BEARD_LP = (0.10, -0.05)        # середина бороды
TIP_G = (0.225, 0.335)          # кисть розовой (рука F)
PALM_LD = (0.225, 0.31)         # ладонь лорда
FIST_SK = (0.238, 0.587)        # когти скелета
REST = (0.0, 0.0, 0.0)
HIPS_F, HIPS_N = (40.0, -80.0, 0.0), (-40.0, 80.0, 0.0)   # руки на бёдрах


def tremble(f, amp, seed=0):
    return random.Random(f * 31 + seed).uniform(-amp, amp)


def turn(f, t0, d0):
    """Разворот: на кадр сжать по ширине, отразить, вернуть. → (dir, sx)."""
    if f < t0:
        return d0, 1.0
    return {t0: (d0, 0.55), t0 + 1: (-d0, 0.3), t0 + 2: (-d0, 0.7)}.get(f, (-d0, 1.0))


def path(f, pts):
    """Кривая Катмулла–Рома через точки [(кадр, (x, y)), ...]."""
    if f <= pts[0][0]:
        return pts[0][1]
    if f >= pts[-1][0]:
        return pts[-1][1]
    i = max(j for j in range(len(pts) - 1) if pts[j][0] <= f)
    p0, p1 = pts[max(i - 1, 0)][1], pts[i][1]
    p2, p3 = pts[i + 1][1], pts[min(i + 2, len(pts) - 1)][1]
    t = (f - pts[i][0]) / (pts[i + 1][0] - pts[i][0])

    def cr(a, b, c, d):
        return 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t * t + (-a + 3 * b - 3 * c + d) * t ** 3)

    return cr(p0[0], p1[0], p2[0], p3[0]), cr(p0[1], p1[1], p2[1], p3[1])


class Film:
    frames = 600

    def __init__(self):
        self.bg = bg.meadow('spring', seed=11)
        self.clouds = bg.Clouds(seed=8)
        self.g = Big(GIRL_BIG)
        self.lp = Big(LA_PEACE)
        self.ld = Big(LORD_BIG)
        self.sk = Big(SKELETON_BIG)
        self.ball = Ball('girl_small')
        self._cache = {}
        c = self.cam = Camera()
        c.shake(108, 8, 8); c.punch(108, 10, 0.05, (800, 670))
        c.shake(133, 6, 6)
        c.shake(176, 8, 10); c.punch(176, 10, 0.05, (840, 795))
        c.shake(203, 10, 12); c.punch(203, 12, 0.06, (GB_X, 920))
        c.flash(250, 3, 0.45); c.shake(250, 7, 10); c.punch(250, 10, 0.05, (GB_X, 600))
        c.shake(326, 6, 7)
        c.flash(377, 3, 0.35); c.shake(377, 14, 18); c.punch(377, 12, 0.08, self.hit_skull())
        c.flash(440, 3, 0.35); c.shake(440, 14, 18); c.punch(440, 12, 0.08, self.hit_belly())
        c.flash(482, 4, 0.4); c.shake(482, 16, 22); c.punch(482, 14, 0.10, self.hit_face())

    def _memo(self, key, fn):
        if key not in self._cache:
            self._cache[key] = fn()
        return self._cache[key]

    # ---------------------------------------------------------------- точки касаний
    def hit_ball1(self):
        """Лоб шарика в момент удара о ладонь (кадр 108)."""
        b = self.girl_ball(108)
        return b['x'] + 150 * b['sx'], b['y'] - 150 * b['sy']

    def hit_ball2(self):
        b = self.girl_ball(176)
        return b['x'] + 150 * b['sx'], b['y'] - 150 * b['sy']

    def hit_lord_back(self):
        return self._memo('back', lambda: self.ld.joint(self.lord(351, raw=True), 'torso', (-0.24, -0.30)))

    def hit_skull(self):
        return self._memo('skull', lambda: self.sk.joint(self.skel(377), 'head', (0.30, -0.62)))

    def hit_lp_head(self):
        return self._memo('lphead', lambda: self.lp.joint(self.lapeace(414, raw=True), 'head', (-0.20, -0.75)))

    def hit_belly(self):
        return self._memo('belly', lambda: self.ld.joint(self.lord(440, raw=True), 'torso', (0.20, 0.04)))

    def hit_face(self):
        return self._memo('face', lambda: self.lp.joint(self.lapeace(482, raw=True), 'head', (0.22, -0.52)))

    # ================================================================ розовая-шарик
    def girl_ball(self, f):
        if f >= 256:
            return None
        p = dict(dir=1, eyes='normal', mouth='smile normal')
        x, lift, sx, sy, rot = GB_X, 0.0, 1.0, 1.0, 0.0
        if 40 <= f < 56:
            p.update(mouth='puzzlement', eye_s=(1.15, 1.15))
        if f >= 56:
            p.update(eyes='angry')
        if 76 <= f < 95:
            x, lift = hop(f, 80, 92, GB_X, 590, 70)
            sx, sy = ball_squash(f, 80, 92, 4, 3)
        elif 95 <= f < 111:
            if f < 99:
                t = seg(f, 95, 99)
                x, sx, sy = 590, lerp(1.0, 1.2, t), lerp(1.0, 0.8, t)
            elif f < 108:
                t = seg(f, 99, 108)
                x, lift = lerp(590, 683, ease_out(t)), 95 * math.sin(math.pi / 2 * t)
                sx, sy = (0.86, 1.15) if f < 105 else (lerp(0.86, 0.76, seg(f, 105, 108)), 1.2)
            else:
                x, lift, sx, sy = 683, 95, 0.76, 1.2
        elif 111 <= f < 150:
            p.update(eyes='sad', mouth='puzzlement')
            if f < 133:
                t = seg(f, 111, 133)
                x = lerp(683, GB_X, ease_out(t))
                lift = (1 - t) * 95 + 4 * 220 * t * (1 - t)
                rot = -360 * ease_out(t)
            elif f < 135:
                sx, sy = 1.35, 0.65
            elif f < 141:
                t = seg(f, 135, 141)
                lift = 40 * 4 * t * (1 - t)
            elif f < 147:
                t = seg(f, 141, 147)
                sx, sy = lerp(1.15, 1.0, t), lerp(0.85, 1.0, t)
        elif 150 <= f < 219:
            p.update(eyes='angry', mouth='sad')
            if f < 156:
                x += tremble(f, 2)
            elif f < 176:
                # раскручивается на месте и катится на Ла Писа
                rot = 54 * (f - 156)        # к удару ровно три оборота
                if f >= 164:
                    x = lerp(GB_X, 691, ease_in(seg(f, 164, 176)))
                sx, sy = (1.08, 0.94) if f < 164 else (1.0, 1.0)
            elif f < 179:
                x, rot = 691, 1080
            elif f < 203:
                # низкий шлепок подбрасывает её вверх — и вниз блином
                p.update(eyes='sad', mouth='puzzlement')
                t = seg(f, 179, 203)
                x, lift, rot = lerp(691, GB_X, t), 4 * 470 * t * (1 - t), 1080 + 720 * t
            elif f < 209:
                p.update(eyes='sad', mouth='puzzlement')
                sx, sy = 1.9, 0.25
            else:
                p.update(eyes='sad', mouth='puzzlement')
                t = f - 209
                sx, sy = ((1.9, 0.25), (1.2, 0.7), (0.85, 1.2), (0.9, 1.15), (1.08, 0.93),
                          (1.05, 0.96), (1.0, 1.0))[min(t, 6)] if t < 7 else (1.0, 1.0)
        if f >= 219:
            p.update(eyes='angry', mouth='puzzlement')
            x += tremble(f, 2)
        if f >= 237:
            p.update(mouth='theeth smile')
            x += tremble(f, 6, 1)
            p['scale'] = lerp(1.0, 1.1, seg(f, 237, 250))
        p.update(x=x, y=G - lift, sx=sx, sy=sy, rot=rot)
        return p

    # ================================================================ Ла Пис
    STAND_LP = dict(x=LP_X, y=G - HOV, dir=-1, lean=0.0, head=0.0, armF=REST, armN=REST,
                    sw_mouth='mouth smile', eyes=(1.0, 1.0), hearts=0.0, blush=0.0, scale=1.0)

    def lapeace(self, f, raw=False):
        key = ('lp', f, raw)
        if key in self._cache:
            return self._cache[key]
        p = self._lapeace(f, raw)
        self._cache[key] = p
        return p

    def _lapeace(self, f, raw):
        lp = self.lp
        keys = [
            (0, dict(self.STAND_LP)),
            # бьёт ладонью шарик, летящий лбом
            (96, {}), (102, dict(armF=(-35.0, 30.0, 0.0))),
            (111, dict(sw_mouth='mouth smile theeth')),
            (120, {}), (128, dict(armF=REST)),
            # низкий шлепок
            (158, {}), (166, dict(lean=15.0, armF=(-50.0, 10.0, 0.0), sw_mouth='mouth smile')),
            (172, {}, 'in'),
            (186, {}), (196, dict(lean=0.0, armF=REST, sw_mouth='mouth smile theeth')),
            # смеётся, потом пугается превращения
            (196, {}), (200, dict(head=-8.0)), (214, {}), (218, dict(head=0.0)),
            (252, {}), (256, dict(sw_mouth='mouth sad', eyes=(1.3, 1.3), lean=-6.0)),
            # поцелуй попал — влюбился
            (300, {}), (303, dict(sw_mouth='mouth smile', eyes=(1.0, 1.0), lean=0.0, hearts=1.35, blush=1.0)),
            (307, dict(hearts=1.0)),
        ]
        p = pose_keys(f, keys)
        # подплывает в начале (лёгкое покачивание только в движении)
        if f < 56:
            t = seg(f, 0, 48)
            p['x'] = lerp(LP_X0, LP_X, ease_out(t))
            p['y'] = G - HOV - 6 * math.sin(2 * math.pi * f / 20) * (1 - seg(f, 40, 54))
            p['lean'] = -5.0 * math.sin(math.pi * seg(f, 34, 56))
        # гладит бороду
        for a, b in ((56, 80), (130, 150), (448, 456)):
            if a - 6 <= f < b + 6 and not raw:
                q = dict(p, armN=REST)
                beard = lp.joint(q, 'head', BEARD_LP)
                stroke = beard[0], beard[1] + 14 * math.sin(2 * math.pi * (f - a) / 10)
                tgt = lp.arm_ik(q, 'N', stroke, tip=(-0.344, 0.45))
                p['armN'] = lerp(REST, tgt, ease_io(min(seg(f, a - 6, a), 1 - seg(f, b, b + 6))))
                p['sw_mouth'] = 'mouth smile theeth'
        # удар ладонью в лоб шарику (кадр 108)
        if 102 <= f < 120 and not raw:
            hit = lp.arm_ik(dict(p, armF=REST), 'F', self.hit_ball1(), tip=TIP_LP)
            p['armF'] = lerp((-35.0, 30.0, 0.0), hit, ease_in(seg(f, 102, 108)))
        if 120 <= f < 128 and not raw:
            hit = lp.arm_ik(dict(p, armF=REST), 'F', self.hit_ball1(), tip=TIP_LP)
            p['armF'] = lerp(hit, REST, ease_io(seg(f, 120, 128)))
        # низкий шлепок (кадр 176)
        if 172 <= f < 196 and not raw:
            q = self._lapeace(176, True)
            hit = lp.arm_ik(dict(q, armF=REST), 'F', self.hit_ball2(), tip=TIP_LP)
            if f < 176:
                p['armF'] = lerp((-50.0, 10.0, 0.0), hit, ease_in(seg(f, 172, 176)))
            elif f < 186:
                p['armF'] = hit
            else:
                p['armF'] = lerp(hit, REST, ease_io(seg(f, 186, 196)))
        # смех
        if 200 <= f < 214:
            p['y'] = G - HOV - 6 * (((f - 200) // 3) % 2)
        if 256 <= f < 300:
            p['x'] = LP_X + tremble(f, 2)
        # мечтательно подплывает к ней
        if 306 <= f < 414:
            t = seg(f, 306, 332)
            p['x'] = lerp(LP_X, LP2, ease_io(t))
            p['y'] = G - HOV - 5 * math.sin(2 * math.pi * (f - 306) / 26) * (1 - seg(f, 326, 334)) * (f < 334)
            p['head'] = 5 * math.sin(2 * math.pi * (f - 306) / 30)
        # лорд отпихнул (кадр 414)
        if f >= 414:
            p['x'] = LP2
            t = seg(f, 414, 420)
            p['x'] = lerp(LP2, LP2 - 30, ease_out(t))
            p['lean'] = 12 * math.sin(math.pi * seg(f, 414, 426))
            p['hearts'] = 0.0 if f >= 416 else p['hearts']
            p['blush'] = 0.0 if f >= 416 else p['blush']
            p['eyes'] = (1.3, 1.3) if 416 <= f < 420 else (1.0, 1.0)
            if f >= 420:
                p['sw_mouth'] = 'mouth sad'
        d, sx = turn(f, 426, -1)
        if f >= 460:
            d, sx = turn(f, 460, d)
        p['dir'], p['sx'] = d, sx
        # подлетает к лорду и бьёт ладонью снизу (кадр 440)
        if 426 <= f < 462:
            t = seg(f, 428, 436)
            p['x'] = lerp(LP2 - 30, LP3, ease_io(t))
            p['lean'] = lerp(0.0, 8.0, t) if f < 448 else lerp(8.0, 0.0, seg(f, 448, 456))
            if not raw:
                q = dict(p, x=LP3, lean=8.0, dir=1, sx=1.0)
                hit = lp.arm_ik(dict(q, armF=REST), 'F', self.hit_belly(), tip=TIP_LP)
                wind = (-40.0, 20.0, 0.0)
                if f < 436:
                    p['armF'] = lerp(REST, wind, ease_io(t))
                elif f < 440:
                    p['armF'] = lerp(wind, hit, ease_in(seg(f, 436, 440)))
                elif f < 448:
                    p['armF'] = hit
                else:
                    p['armF'] = lerp(hit, REST, ease_io(seg(f, 448, 455)))
            p['sw_mouth'] = 'mouth sad' if f < 444 else 'mouth smile theeth'
        # снова влюблён, плывёт к ней — пощёчина (кадр 482)
        if f >= 462:
            t = seg(f, 462, 482)
            p.update(x=lerp(LP3, 700, ease_io(t)), hearts=1.0, blush=1.0, sw_mouth='mouth smile',
                     lean=6.0, head=4 * math.sin(2 * math.pi * (f - 462) / 14))
            p['y'] = G - HOV - 5 * math.sin(2 * math.pi * (f - 462) / 20)
        if f >= 483:
            p.update(x=700, y=G - HOV, hearts=0.0, eyes=(1.35, 1.35), sw_mouth='mouth sad', head=-18.0, lean=-8.0)
        if f >= 485:
            # улетает вдаль: всё меньше, к горизонту
            t = seg(f, 485, 514)
            p.update(x=lerp(700, 1460, ease_out(t)), y=lerp(G - HOV, 640, ease_out(t)),
                     scale=lerp(1.0, 0.04, ease_out(t)), rot=-720 * t,
                     armF=(120.0, 20.0, 0.0), armN=(-120.0, -20.0, 0.0))
        return p

    # ================================================================ лорд
    STAND_LD = dict(x=LD_X, dir=-1, hip=(0.0, 0.0), lean=0.0, head=0.0, armF=REST, armN=REST,
                    footF=(0.0, 0.0), footN=(0.0, 0.0), eyes=(1.0, 1.0), mouth=(1.0, 1.0),
                    face_shift=0.05, scale=1.0, y=G, hearts=1.0, blush=1.0)

    def lord(self, f, raw=False):
        key = ('ld', f, raw)
        if key not in self._cache:
            self._cache[key] = self._lord(f, raw)
        return self._cache[key]

    def _lord(self, f, raw):
        if f < 296 or f >= 464:
            return None
        ld = self.ld
        keys = [
            (296, dict(self.STAND_LD)),
            (326, {}), (330, dict(lean=6.0)),
            # скелет толкнул в спину
            (351, {}, 'out'), (355, dict(lean=18.0, head=10.0, hearts=0.0, blush=0.0, eyes=(1.3, 1.3))),
            (358, dict(eyes=(1.0, 0.55))), (362, dict(lean=0.0, head=0.0)),
            # замах и удар
            (365, {}), (372, dict(lean=-6.0, armF=(-40.0, 70.0, 0.0))),
            (373, {}, 'in'), (377, dict(lean=8.0)),
            (392, {}), (400, dict(lean=0.0, armF=REST)),
            (402, dict(hearts=1.0, blush=1.0, eyes=(1.0, 1.0))),
            # получил ладонью в живот
            (436, {}), (440, dict(hearts=0.0, blush=0.0, eyes=(1.35, 1.35), head=-10.0)),
        ]
        p = pose_keys(f, keys)
        w = walk(f, 296, 2150, LD_X, 4, 6, ld, -1, lift=0.12, bob=0.05, arm=28.0)
        if w:
            p.update(w)
            p['lean'] = 10.0
        d, sx = turn(f, 362, -1)
        d, sx2 = turn(f, 400, d) if f >= 400 else (d, 1.0)
        p['dir'], p['sx'] = d, sx * sx2
        if 373 <= f < 400 and not raw:
            q = dict(p, lean=8.0, dir=1, sx=1.0)
            hit = ld.arm_ik(dict(q, armF=REST), 'F', self.hit_skull(), tip=PALM_LD)
            if f < 377:
                p['armF'] = lerp((-40.0, 70.0, 0.0), hit, ease_in(seg(f, 373, 377)))
            elif f < 392:
                p['armF'] = hit
            else:
                p['armF'] = lerp(hit, REST, ease_io(seg(f, 392, 400)))
        # шаг к Ла Пису и толчок в затылок (кадр 414)
        w = walk(f, 404, LD_X, LD2, 1, 8, ld, -1)
        if w:
            p.update({k: v for k, v in w.items() if not k.startswith('arm')})
        elif f >= 416:
            p['x'] = LD2
        if 406 <= f < 430 and not raw:
            q = dict(p, x=LD2, footF=(0.0, 0.0), footN=(0.0, 0.0), hip=(0.0, 0.0))
            push = ld.arm_ik(dict(q, armF=REST), 'F', self.hit_lp_head(), tip=PALM_LD)
            if f < 414:
                p['armF'] = lerp(REST, push, ease_io(seg(f, 406, 414)))
            elif f < 420:
                p['armF'] = push
            else:
                p['armF'] = lerp(push, REST, ease_io(seg(f, 420, 430)))
        # взлетает вверх за кадр
        if f >= 443:
            t = seg(f, 443, 463)
            p.update(x=LD2 + 40 * t, y=G - 1150 * t, rot=720 * t,
                     armF=(150.0, 20.0, 0.0), armN=(-150.0, -20.0, 0.0), footF=(0.06, -0.06), footN=(-0.06, -0.1))
        return p

    # ================================================================ скелет
    STAND_SK = dict(x=SK_X, dir=-1, wings=20.0, hip=(0.0, 0.0), lean=0.0, head=0.0,
                    armF=REST, armN=REST, footF=(0.0, 0.0), footN=(0.0, 0.0),
                    eyes=(1.0, 1.0), mouth=(1.0, 1.0), face_shift=0.035, scale=1.0, y=G,
                    hearts=1.0, blush=1.0)

    def skel(self, f):
        key = ('sk', f)
        if key not in self._cache:
            self._cache[key] = self._skel(f)
        return self._cache[key]

    def _skel(self, f):
        if f < 304 or f >= 400:
            return None
        sk = self.sk
        keys = [
            (304, dict(self.STAND_SK)),
            (326, dict(hip=(0.0, 0.10), wings=-10.0), 'out'), (334, dict(hip=(0.0, 0.0), wings=20.0, lean=6.0)),
            (366, {}), (369, dict(hearts=0.0, blush=0.0, eyes=(1.35, 1.35))),
            (377, {}, 'out'), (380, dict(head=-15.0, lean=-8.0)),
        ]
        p = pose_keys(f, keys)
        if f < 326:
            # пикирует из правого верхнего угла, крылья машут
            x, y = path(f, [(304, (2120, -260)), (312, (1900, 260)), (320, (1660, 760)), (326, (SK_X, G))])
            p.update(x=x, y=y, lean=18.0 * (1 - seg(f, 318, 326)), wings=15 + 35 * math.sin(2 * math.pi * (f - 304) / 6),
                     footF=(-0.04, -0.03), footN=(-0.07, -0.02), armF=(-25.0, 15.0, 0.0), armN=(-30.0, 15.0, 0.0))
        # толкает лорда в спину (кадр 351)
        if 345 <= f < 366:
            q = dict(p, armF=REST)
            push = sk.arm_ik(q, 'F', self.hit_lord_back(), tip=FIST_SK)
            if f < 351:
                p['armF'] = lerp(REST, push, ease_io(seg(f, 345, 351)))
            elif f < 358:
                p['armF'] = push
            else:
                p['armF'] = lerp(push, REST, ease_io(seg(f, 358, 366)))
        # улетает вправо, кувыркаясь
        if f >= 380:
            t = seg(f, 380, 399)
            p.update(x=SK_X + 760 * t, y=G - 300 * math.sin(math.pi * t * 0.8), rot=-720 * t,
                     wings=-30.0, armF=(-60.0, 20.0, 0.0), armN=(60.0, 20.0, 0.0))
        return p

    # ================================================================ большая розовая
    STAND_G = dict(x=GB_X, dir=1, hip=(0.0, 0.0), lean=0.0, head=0.0, armF=REST, armN=REST,
                   footF=(0.0, 0.0), footN=(0.0, 0.0), sw_eyes='normal', sw_mouth='smile normal',
                   face_shift=0.0, scale=1.0, y=G)

    def girl(self, f):
        key = ('g', f)
        if key not in self._cache:
            self._cache[key] = self._girl(f)
        return self._cache[key]

    def _girl(self, f):
        if f < 256:
            return None
        g = self.g
        keys = [
            (256, dict(self.STAND_G, scale=0.55), 'lin'),
            (260, dict(scale=1.1)), (263, dict(scale=0.96)), (266, dict(scale=1.0)),
            (270, {}), (276, dict(armF=HIPS_F, armN=HIPS_N, sw_mouth='happy')),
            (300, {}), (308, dict(armF=HIPS_F, sw_mouth='happy')),
            (461, {}), (462, dict(sw_eyes='angry', sw_mouth='sad')),
            (470, {}), (477, dict(armF=(135.0, 40.0, 0.0), lean=-5.0)),
            (478, {}, 'in'), (482, dict(lean=10.0)),
            (490, {}), (500, dict(armF=HIPS_F, lean=0.0, sw_eyes='normal', sw_mouth='happy')),
            (522, {}), (528, dict(armF=REST, armN=REST)),
            (562, {}), (566, dict(face_shift=-0.07)),
            (566, {}), (574, dict(armF=HIPS_F, armN=HIPS_N)),
        ]
        p = pose_keys(f, keys)
        # воздушный поцелуй Ла Пису: рука к краю лица, потом вперёд
        for a in (280, 576):
            if a <= f < a + 22:
                kiss = g.joint(dict(p, armF=REST), 'head', (0.27, -0.50))
                to_face = g.arm_ik(dict(p, armF=REST), 'F', kiss, tip=TIP_G)
                fwd = (95.0, 0.0, 0.0) if a == 280 else (110.0, 10.0, 0.0)
                p['sw_mouth'] = 'puzzlement' if f < a + 12 else 'happy'
                if f < a + 6:
                    p['armF'] = lerp(HIPS_F, to_face, ease_io(seg(f, a, a + 6)))
                elif f < a + 10:
                    p['armF'] = lerp(to_face, fwd, ease_out(seg(f, a + 6, a + 10)))
                elif a == 280:
                    p['armF'] = lerp(fwd, HIPS_F, ease_io(seg(f, a + 14, a + 22)))
                else:
                    p['armF'] = fwd if f < a + 16 else lerp(fwd, HIPS_F, ease_io(seg(f, a + 16, a + 22)))
        # пощёчина (кадр 482)
        if 478 <= f < 500:
            hit = g.arm_ik(dict(p, armF=REST, lean=10.0), 'F', self.hit_face(), tip=TIP_G)
            if f < 482:
                p['armF'] = lerp((135.0, 40.0, 0.0), hit, ease_in(seg(f, 478, 482)))
            elif f < 490:
                p['armF'] = hit
            else:
                p['armF'] = lerp(hit, HIPS_F, ease_io(seg(f, 490, 500)))
        w = walk(f, 528, GB_X, CENTER, 4, 7, g, 1)
        if w:
            p.update(w)
        elif f >= 528:
            p['x'] = CENTER
        return p

    # ================================================================ кадр
    def kiss_heart(self, f):
        """Сердце воздушного поцелуя: от губ розовой к лицу Ла Писа (288–302)."""
        if not 288 <= f < 303:
            return None
        g0 = self.g.joint(self.girl(288), 'face', (0.05, -0.50))
        lp1 = self.lp.joint(self.lapeace(302), 'head', (0.15, -0.50))
        t = seg(f, 288, 302)
        x = lerp(g0[0], lp1[0], t)
        y = lerp(g0[1], lp1[1], t) - 90 * math.sin(math.pi * t)
        return x, y, 34 + 6 * math.sin(f * 1.3)

    def draw(self, ctx, f):
        ctx.save()
        self.cam.apply(ctx, f)
        ctx.set_source_surface(self.bg, -bg.M, -bg.M)
        ctx.paint()
        self.clouds.draw(ctx, f)

        gb, g, lp, ld, sk = self.girl_ball(f), self.girl(f), self.lapeace(f), self.lord(f), self.skel(f)

        # тени
        if gb:
            fx.shadow(ctx, gb['x'], G + 4, 250 * gb.get('scale', 1.0) * gb['sx'], G - gb['y'], (0.1, 0.35, 0.05))
        if g:
            fx.shadow(ctx, g['x'], G + 6, 280 * g['scale'], G - g['y'], (0.1, 0.35, 0.05))
        if lp and f < 490:
            fx.shadow(ctx, lp['x'], G + 4, 230 * lp['scale'], G - HOV - lp['y'] + 10, (0.1, 0.35, 0.05))
        if ld and f < 450:
            fx.shadow(ctx, ld['x'], G + 6, 290, G - ld['y'], (0.1, 0.35, 0.05))
        if sk and f < 392:
            fx.shadow(ctx, sk['x'], G + 6, 300, G - sk['y'], (0.1, 0.35, 0.05))

        if 237 <= f < 256:
            fx.rays(ctx, GB_X, G - 160, f, r=230 + 60 * seg(f, 237, 250), alpha=seg(f, 237, 241))

        wings = ('wing 1', 'wing 2')
        draw = {
            'ball': lambda: gb and self.ball.draw(ctx, gb),
            'girl': lambda: g and self.g.draw(ctx, g),
            'lp': lambda: lp and self.lp.draw(ctx, lp),
            'lord': lambda: ld and self.ld.draw(ctx, ld),
            'skw': lambda: sk and self.sk.draw(ctx, dict(sk, only=wings)),
            'sk': lambda: sk and self.sk.draw(ctx, dict(sk, hide=wings)),
        }
        if f < 362:
            order = ['ball', 'girl', 'lp', 'skw', 'lord', 'sk']
        elif f < 400:
            order = ['ball', 'girl', 'lp', 'skw', 'sk', 'lord']   # кулак лорда поверх черепа
        elif f < 428:
            order = ['girl', 'lp', 'lord']                        # рука лорда на затылке Ла Писа
        elif f < 462:
            order = ['girl', 'lord', 'lp']                        # ладонь Ла Писа поверх лорда
        else:
            order = ['lp', 'girl']                                # пощёчина поверх лица
        for name in order:
            draw[name]()

        self.effects(ctx, f, gb, g, lp, ld, sk)
        ctx.restore()
        fx.flash(ctx, self.cam.flash_alpha(f))

    def effects(self, ctx, f, gb, g, lp, ld, sk):
        # шарик: прыжки, удар о ладонь, блин
        fx.dust(ctx, 590, G, f - 92, n=4, spread=80, size=0.6, seed=1)
        fx.spark(ctx, *self.hit_ball1(), f - 108, 0.8)
        fx.dust(ctx, GB_X, G, f - 133, n=6, spread=140, seed=2)
        if gb and 136 <= f < 162:
            fx.dizzy(ctx, gb['x'], G - 330, f - 136, rx=95)
        if gb and 150 <= f < 158:
            fx.anger(ctx, gb['x'] + 95, G - 270, f, 1.2)
        if 158 <= f < 176:
            fx.dust(ctx, gb['x'] - 60, G, (f - 158) % 10, n=2, spread=50, size=0.5, seed=f // 10)
        fx.spark(ctx, *self.hit_ball2(), f - 176, 0.9)
        fx.dust(ctx, GB_X, G, f - 203, n=8, spread=220, size=1.1, seed=3)
        if gb and 219 <= f < 250:
            fx.anger(ctx, gb['x'] + 95, G - 270, f, 1.2)
            fx.steam(ctx, gb['x'], G - 300, f - 219, 1.1)
        fx.smoke(ctx, GB_X, 640, f - 250, size=1.5, seed=5)
        # Ла Пис пугается
        if lp and 256 <= f < 300:
            top = self.lp.joint(lp, 'head', (0.04, -0.95))
            fx.sweat(ctx, top[0] - 100, top[1] + 80, f - 256, 1.1, side=-1)
        # воздушный поцелуй
        kh = self.kiss_heart(f)
        if kh:
            fx.heart(ctx, kh[0], kh[1], kh[2])
        # влюблённые: сердечки над головами, слюнки
        if lp and lp.get('hearts') and f < 485:
            top = self.lp.joint(lp, 'head', (0.04, -0.95))
            fx.hearts_up(ctx, top[0], top[1] - 10, f, 3, 0.9)
        if ld and ld.get('hearts') and ld['hearts'] > 0.5 and f < 440:
            top = self.ld.joint(ld, 'head', (0.0, -1.0))
            fx.hearts_up(ctx, top[0], top[1] - 10, f + 7, 3, 1.1)
            if f >= 326:
                fx.drool(ctx, *self.ld.joint(ld, 'face', (-0.13, -0.47)), f)
        if sk and sk.get('hearts') and sk['hearts'] > 0.5:
            top = self.sk.joint(sk, 'head', (0.115, -0.86))
            fx.hearts_up(ctx, top[0], top[1] - 10, f + 3, 3, 1.1)
            if f >= 326:
                fx.drool(ctx, *self.sk.joint(sk, 'face', (-0.03, -0.42)), f + 5)
        fx.dust(ctx, LD_X, G, f - 320, n=6, spread=150, seed=4)
        fx.dust(ctx, SK_X, G, f - 326, n=6, spread=170, seed=5)
        # лорд злится
        if ld and 356 <= f < 372:
            top = self.ld.joint(ld, 'head', (0.0, -1.0))
            fx.anger(ctx, top[0] + 70, top[1] + 120, f, 1.3)
        # удар лорда по черепу — скелет улетает вправо
        fx.spark(ctx, *self.hit_skull(), f - 377, 1.1)
        fx.twinkle(ctx, 1860, 360, f - 394, 1.4, dur=22)
        # Ла Пис злится, бьёт лорда снизу — лорд улетает вверх
        if lp and 420 <= f < 432:
            top = self.lp.joint(lp, 'head', (0.04, -0.95))
            fx.anger(ctx, top[0] + 60, top[1] + 60, f, 1.0)
        fx.spark(ctx, *self.hit_belly(), f - 440, 1.1)
        fx.twinkle(ctx, LD2 + 40, 50, f - 457, 1.4, dur=22)
        # пощёчина — Ла Пис улетает вдаль
        fx.spark(ctx, *self.hit_face(), f - 482, 0.7)
        fx.twinkle(ctx, 1460, 640, f - 512, 1.2, dur=22)
        # финал: блеск вокруг и сердце зрителю
        if f >= 566:
            for i, (dx, dy, ph) in enumerate(((-330, -620, 0), (300, -700, 7), (-420, -300, 13),
                                               (420, -380, 4), (-220, -840, 10), (260, -160, 16))):
                fx.twinkle(ctx, CENTER + dx, G + dy, (f - 566 + ph * 2) % 26, 0.9, dur=22)
        if f >= 586:
            t = seg(f, 586, 600)
            src = self.g.joint(g, 'face', (0.0, -0.50))
            fx.heart(ctx, lerp(src[0], CENTER, t), lerp(src[1], 420, t), lerp(30, 260, ease_in(t)),
                     alpha=1 - ease_in(seg(f, 594, 600)) * 0.6)
