"""Лорд против Ла Писа: банановая кожура. Осенний луг, день. 25 с = 600 кадров.

 0–4 с      стойка по краям, смотрят друг на друга: лорд-шарик зло подпрыгивает,
            Ла Пис самодовольно гладит бороду
 4–7.5 с    лорд прыжками нападает — Ла Пис встречает его ладонью, лорд отлетает
 7.5–9 с    злость → ухмылка, лучи → дым → большой лорд; Ла Пис пугается
 9–11 с     Ла Пис достаёт банан, съедает и бросает кожуру
 11–12.5 с  лорд идёт — скользит в первый раз: машет руками, но удерживается
 12.5–16.5 с злой лорд идёт дальше — второй раз: падает на спину, кожура на лице
 16.5–19 с  Ла Пис съедает второй банан и кидает кожуру прямо под ногу бегущему лорду —
            третий раз самый сильный: лорд взлетает, переворачивается и с грохотом
            падает на спину — нокаут
 19–25 с    Ла Пис выплывает в центр, гладит бороду, руки вверх — победа
"""
import math
import random

import bg
import fx
from anim import Camera, ball_squash, hop, lerp, pose_keys, seg, walk
from fx import ease_in, ease_io, ease_out
from rig import GROUND_Y as G, LA_PEACE, LORD_BIG, Ball, Big

LB = 440                        # лорд-шарик
LPX = 1480                      # Ла Пис
HOV = 14
LX = 520                        # где появляется большой лорд
CENTER = 960
REST = (0.0, 0.0, 0.0)
TIP_LP = (0.252, 0.50)
TIP_N = (-0.344, 0.47)
BEARD_LP = (0.10, -0.05)
STEP = 116                      # от центра лорда до носка передней ноги при шаге на кожуру
W1, W2, W3 = 760, 990, 1070    # где стоит лорд, наступая на кожуру
P1, P2, P3 = W1 + STEP, W2 + STEP, W3 + STEP
S1, S2, S3 = 272, 338, 420      # кадры, когда нога встаёт на кожуру
KO_X = 490                      # центр лежащего лорда


def tremble(f, amp, seed=0):
    return random.Random(f * 31 + seed).uniform(-amp, amp)


def bezier(t, p0, p1, p2):
    u = 1 - t
    return (u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0],
            u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1])


YEL, YEL_D, BROWN = (1.0, 0.86, 0.22), (0.83, 0.62, 0.10), (0.45, 0.30, 0.12)


def banana(ctx, x, y, rot, s=1.0, eaten=0.0):
    """Банан в руке: жёлтый полумесяц; eaten — доля откушенного сверху (видна мякоть)."""
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(rot)
    ctx.scale(s, s)
    top = -70 + 80 * eaten
    ctx.move_to(-6, 40)
    ctx.curve_to(-26, 10, -24, top + 25, -10, top)
    ctx.line_to(4, top + 2)
    ctx.curve_to(-6, top + 30, -4, 10, 12, 38)
    ctx.close_path()
    ctx.set_source_rgb(*YEL)
    ctx.fill_preserve()
    ctx.set_source_rgb(0.08, 0.05, 0.05)
    ctx.set_line_width(4)
    ctx.stroke()
    if eaten > 0:
        ctx.save()
        ctx.translate(-3, top + 1)
        ctx.scale(8, 4)
        ctx.arc(0, 0, 1, 0, 2 * math.pi)
        ctx.restore()
        ctx.set_source_rgb(1.0, 0.97, 0.85)
        ctx.fill_preserve()
        ctx.set_source_rgb(0.08, 0.05, 0.05)
        ctx.set_line_width(2.5)
        ctx.stroke()
    ctx.rectangle(-6, 36, 16, 10)
    ctx.set_source_rgb(*BROWN)
    ctx.fill_preserve()
    ctx.set_source_rgb(0.08, 0.05, 0.05)
    ctx.set_line_width(3)
    ctx.stroke()
    ctx.restore()


def peel(ctx, x, y, rot, s=1.0):
    """Кожура: четыре лепестка в стороны, коричневые пятнышки; (x, y) — низ."""
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(rot)
    ctx.scale(s, s)
    for a, ln in ((-150, 46), (-110, 40), (-70, 42), (-30, 48)):
        r = math.radians(a)
        ex, ey = ln * math.cos(r), ln * math.sin(r) + 4
        nx, ny = -math.sin(r) * 11, math.cos(r) * 11
        ctx.move_to(-nx * 0.6, -ny * 0.6 - 8)
        ctx.curve_to(ex * 0.5 - nx, ey * 0.5 - ny - 8, ex - nx * 0.4, ey - ny * 0.4, ex, ey)
        ctx.curve_to(ex + nx * 0.4, ey + ny * 0.4, ex * 0.5 + nx, ey * 0.5 + ny - 8, nx * 0.6, ny * 0.6 - 8)
        ctx.close_path()
        ctx.set_source_rgb(*YEL)
        ctx.fill_preserve()
        ctx.set_source_rgb(0.08, 0.05, 0.05)
        ctx.set_line_width(3.5)
        ctx.stroke()
        ctx.arc(ex * 0.6, ey * 0.6 - 6, 3, 0, 2 * math.pi)
        ctx.set_source_rgb(*BROWN)
        ctx.fill()
    ctx.rectangle(-8, -14, 16, 14)
    ctx.set_source_rgb(*YEL_D)
    ctx.fill_preserve()
    ctx.set_source_rgb(0.08, 0.05, 0.05)
    ctx.set_line_width(3)
    ctx.stroke()
    ctx.restore()


class Film:
    frames = 600

    def __init__(self):
        self.bg = bg.meadow('autumn', seed=61)
        self.clouds = bg.Clouds(seed=55)
        self.lb_r = Ball('lord_small')
        self.ld = Big(LORD_BIG)
        self.lp = Big(LA_PEACE)
        self.half = (LORD_BIG['sole'] - LORD_BIG['top']) * self.ld.k / 2
        self._cache = {}
        c = self.cam = Camera()
        c.shake(132, 8, 8); c.punch(132, 10, 0.05, self.slap_pt())
        c.shake(158, 6, 6)
        c.flash(200, 3, 0.45); c.shake(200, 7, 10); c.punch(200, 10, 0.05, (LX, 600))
        c.shake(S1 + 2, 6, 6)
        c.shake(350, 14, 16); c.punch(350, 12, 0.06, (W2 - 200, G - 100))
        c.flash(450, 4, 0.4); c.shake(450, 24, 28); c.punch(450, 16, 0.10, (KO_X, G - 100))
        c.shake(498, 4, 4)

    def _memo(self, key, fn):
        if key not in self._cache:
            self._cache[key] = fn()
        return self._cache[key]

    # ================================================================ лорд-шарик
    def slap_pt(self):
        return self._memo('slap', lambda: (lambda b: (b['x'] + 150 * b['sx'], b['y'] - 150 * b['sy']))(self.ball(132)))

    def ball(self, f):
        key = ('b', f)
        if key not in self._cache:
            self._cache[key] = self._ball(f)
        return self._cache[key]

    def _ball(self, f):
        if f >= 204:
            return None
        p = dict(dir=1, face_shift=0.12, eyes='angry', mouth='theeth smile')
        x, lift, sx, sy, rot = LB, 0.0, 1.0, 1.0, 0.0
        for a in (22, 44):
            if a - 4 <= f < a + 12:
                _, lift = hop(f, a, a + 8, LB, LB, 50)
                sx, sy = ball_squash(f, a, a + 8, 4, 4)
        if 96 <= f < 126:
            if f < 112:
                x, lift = hop(f, 98, 110, LB, 800, 80)
                sx, sy = ball_squash(f, 98, 110, 2, 2)
            else:
                x, lift = hop(f, 112, 124, 800, 1080, 70)
                sx, sy = ball_squash(f, 112, 124, 2, 2)
        elif 126 <= f < 135:
            t = ease_in(seg(f, 126, 132))
            x = lerp(1080, 1185, t)
            lift = 60 * math.sin(math.pi * seg(f, 126, 134))
            sx, sy = (0.84, 1.15) if f < 132 else (0.76, 1.2)
        elif 135 <= f < 158:
            t = seg(f, 135, 158)
            x = lerp(1185, LX, ease_out(t))
            lift = 4 * 300 * t * (1 - t) + (1 - t) * 50
            rot = -720 * ease_out(t)
            p.update(eyes='sad', mouth='puzzlement')
        elif f >= 158:
            x = LX
            if f < 160:
                sx, sy = 1.35, 0.65
            elif f < 168:
                t = seg(f, 160, 168)
                lift = 40 * 4 * t * (1 - t)
            p.update(eyes='sad', mouth='puzzlement')
            if f >= 172:
                p.update(eyes='angry', mouth='puzzlement')
                x += tremble(f, 2)
            if f >= 186:
                p['mouth'] = 'theeth smile'
                x += tremble(f, 6, 1)
                p['scale'] = lerp(1.0, 1.1, seg(f, 186, 200))
        p.update(x=x, y=G - lift, sx=sx, sy=sy, rot=rot)
        return p

    # ================================================================ большой лорд
    STAND = dict(x=LX, dir=1, hip=(0.0, 0.0), lean=0.0, head=0.0, armF=REST, armN=REST,
                 footF=(0.0, 0.0), footN=(0.0, 0.0), eyes=(1.0, 0.6), mouth=(1.0, 1.0),
                 face_shift=0.05, scale=1.0, y=G)

    def at_center(self, p, cx, cy):
        p['x'] = cx
        p['y'] = cy + self.half
        return p

    def lord(self, f):
        key = ('ld', f)
        if key not in self._cache:
            self._cache[key] = self._lord(f)
        return self._cache[key]

    def _lord(self, f):
        if f < 200:
            return None
        k = self.ld.k
        keys = [
            (200, dict(self.STAND, scale=0.55), 'lin'),
            (204, dict(scale=1.1)), (207, dict(scale=0.96)), (210, dict(scale=1.0)),
            (226, dict(armF=(40.0, 60.0, 0.0), armN=(-30.0, 50.0, 0.0))),    # кулаки к бою
        ]
        p = pose_keys(f, keys)
        # идёт к кожуре №1
        w = walk(f, 240, LX, W1, 2, 10, self.ld, 1, arm=10.0)
        if w:
            p.update(w)
        elif f >= 240:
            p['x'] = W1
        # шаг на кожуру и скольжение №1: машет руками, удерживается
        if S1 - 6 <= f < 306:
            p['x'] = W1
            fwd = (STEP - 33) / k
            if f < S1:
                t = ease_io(seg(f, S1 - 6, S1))
                p['footF'] = (fwd * t, -0.08 * math.sin(math.pi * t))
            elif f < S1 + 4:
                t = ease_out(seg(f, S1, S1 + 4))
                p['footF'] = (lerp(fwd, fwd + 0.40, t), -0.05 * t)
                p['hip'] = (0.0, 0.10 * t)
                p['lean'] = -16 * t
                p['eyes'] = (1.35, 1.35)
            elif f < S1 + 22:
                wm = (f - S1 - 4) * 0.8
                p['footF'] = (fwd + 0.40, -0.05)
                p['hip'] = (0.0, 0.10)
                p['lean'] = -16 + 6 * math.sin(f * 0.9)
                p['armF'] = (100 + 70 * math.sin(wm), 20.0, 0.0)
                p['armN'] = (-100 + 70 * math.sin(wm + 1.5), -20.0, 0.0)
                p['eyes'] = (1.35, 1.35)
            else:
                t = ease_io(seg(f, S1 + 22, S1 + 32))
                p['footF'] = (lerp(fwd + 0.40, 0.0, t), -0.06 * math.sin(math.pi * t))
                p['hip'] = (0.0, lerp(0.10, 0.0, t))
                p['lean'] = lerp(-10.0, 0.0, t)
                p['armF'], p['armN'] = lerp((100.0, 20.0, 0.0), REST, t), lerp((-100.0, -20.0, 0.0), REST, t)
                p['eyes'] = (1.0, 0.5)
        # злой, идёт к кожуре №2
        w = walk(f, 306, W1, W2, 2, 9, self.ld, 1, arm=14.0)
        if w:
            p.update(w)
            p['eyes'] = (1.0, 0.45)
        elif 306 <= f:
            p['x'] = W2
        # скольжение №2: падает на спину
        if S2 - 6 <= f < 392:
            fwd = (STEP - 33) / k
            if f < S2:
                t = ease_io(seg(f, S2 - 6, S2))
                p['footF'] = (fwd * t, -0.08 * math.sin(math.pi * t))
                p['eyes'] = (1.0, 0.45)
            elif f < 350:
                t = ease_in(seg(f, S2, 350))
                p.update(footF=(fwd + 0.5 * t, -0.35 * t), footN=(0.3 * t, -0.25 * t), hip=(0.0, 0.0),
                         armF=(120.0 * t, 20.0, 0.0), armN=(-110.0 * t, -20.0, 0.0), eyes=(1.4, 1.4),
                         rot=-90 * t, lean=0.0)
                cx = W2 - 150 * t
                cy = lerp(G - self.half, G - 120, t)
                self.at_center(p, cx, cy)
            elif f < 372:
                bounce = 16 * math.sin(math.pi * seg(f, 350, 356))
                p.update(rot=-90.0, footF=(0.20, -0.30), footN=(0.12, -0.25), armF=(30.0, 10.0, 0.0),
                         armN=(-30.0, 10.0, 0.0), eyes=(1.0, 0.15), hip=(0.0, 0.0))
                self.at_center(p, W2 - 150, G - 120 - bounce)
            else:
                t = ease_io(seg(f, 372, 390))
                p.update(rot=lerp(-90.0, 0.0, t), footF=lerp((0.20, -0.30), (0.0, 0.0), t),
                         footN=lerp((0.12, -0.25), (0.0, 0.0), t), armF=lerp((30.0, 10.0, 0.0), REST, t),
                         armN=lerp((-30.0, 10.0, 0.0), REST, t), eyes=(1.0, 0.4), hip=(0.0, 0.0))
                cx = lerp(W2 - 150, W2, t)
                cy = lerp(G - 120, G - self.half, t)
                self.at_center(p, cx, cy)
        # бежит к Ла Пису, замахивается — кожура №3 под ногой: взлетает и падает
        if 392 <= f < S3:
            w = walk(f, 396, W2, W3, 1, 9, self.ld, 1, arm=0.0, lift=0.1)
            if w:
                p.update(w)
            elif f >= 396:
                p['x'] = W3
            t = ease_io(seg(f, 404, S3))
            p['armF'] = lerp(REST, (170.0, 40.0, 0.0), t)       # кулак над головой
            p['lean'] = 6 * t
            p['eyes'] = (1.0, 0.4)
            if f >= S3 - 6:
                # шаг вперёд — прямо на кожуру
                u = ease_io(seg(f, S3 - 6, S3))
                p['footF'] = ((STEP - 33) / k * u, -0.08 * math.sin(math.pi * u))
        if S3 <= f < 452:
            fwd = (STEP - 33) / k
            t = seg(f, S3, 450)
            cx = lerp(W3, KO_X, ease_out(t))
            peak = 170
            cy = lerp(G - self.half, G - 120, ease_in(t)) - peak * math.sin(math.pi * t) * (1 - 0.2 * t)
            p.update(footF=(fwd + 0.3, -0.55), footN=(0.25, -0.5), armF=(150.0, 30.0, 0.0), armN=(-150.0, -30.0, 0.0),
                     eyes=(1.45, 1.45), rot=-(360 + 90) * ease_out(t), lean=0.0, hip=(0.0, 0.0))
            self.at_center(p, cx, cy)
        elif f >= 452:
            bounce = 22 * math.sin(math.pi * seg(f, 450, 458))
            p.update(rot=-90.0, footF=(0.20, -0.30), footN=(0.12, -0.25), armF=(-8.0, 6.0, 0.0),
                     armN=(8.0, 6.0, 0.0), eyes=(1.0, 0.12), head=-10.0, hip=(0.0, 0.0), lean=0.0)
            if f >= 480 and (f - 480) % 30 < 4:
                p['footN'] = (0.16, -0.30)
            self.at_center(p, KO_X, G - 120 - bounce)
        return p

    # ================================================================ Ла Пис
    STAND_LP = dict(x=LPX, y=G - HOV, dir=-1, lean=0.0, head=0.0, armF=REST, armN=REST,
                    sw_mouth='mouth smile', eyes=(1.0, 1.0), scale=1.0)

    def lapeace(self, f):
        key = ('lp', f)
        if key not in self._cache:
            self._cache[key] = self._lapeace(f)
        return self._cache[key]

    def mouth_lp(self, p):
        return self.lp.joint(p, 'face', (0.15, -0.34))

    def hand_n(self, p):
        return self.lp.joint(p, 'N3', TIP_N)

    def _lapeace(self, f):
        lp = self.lp
        keys = [
            (0, dict(self.STAND_LP)),
            (128, {}), (131, dict(lean=10.0)), (140, {}), (148, dict(lean=0.0)),
            (204, {}), (208, dict(eyes=(1.3, 1.3), sw_mouth='mouth sad')),
            (222, {}), (226, dict(eyes=(1.0, 1.0), sw_mouth='mouth smile theeth')),
            (404, {}), (410, dict(eyes=(1.3, 1.3), sw_mouth='mouth sad')),      # кулак над ним!
            (452, dict(eyes=(1.0, 1.0), sw_mouth='mouth smile theeth')),
        ]
        p = pose_keys(f, keys)
        # гладит бороду
        for a, b in ((40, 80), (306, 330), (512, 540), (576, 600)):
            if a - 6 <= f < b + 6:
                q = dict(p, armN=REST)
                beard = lp.joint(q, 'head', BEARD_LP)
                stroke = beard[0], beard[1] + 14 * math.sin(2 * math.pi * (f - a) / 10)
                tgt = lp.arm_ik(q, 'N', stroke, tip=(-0.344, 0.45))
                p['armN'] = lerp(REST, tgt, ease_io(min(seg(f, a - 6, a), 1 - seg(f, b, b + 6))))
        # ладонь в лоб шарику (132)
        if 122 <= f < 146:
            hit = lp.arm_ik(dict(p, armF=REST), 'F', self.slap_pt(), tip=TIP_LP)
            wind = (-35.0, 30.0, 0.0)
            if f < 128:
                p['armF'] = lerp(REST, wind, ease_io(seg(f, 122, 128)))
            elif f < 132:
                p['armF'] = lerp(wind, hit, ease_in(seg(f, 128, 132)))
            elif f < 138:
                p['armF'] = hit
            else:
                p['armF'] = lerp(hit, REST, ease_io(seg(f, 138, 146)))
        # бананы: достать, два укуса, бросок
        for (a, throw) in ((228, 256), (372, 404)):
            if a <= f < throw + 10:
                q = dict(p, armN=REST)
                mouth = self.mouth_lp(q)
                to_mouth = lp.arm_ik(q, 'N', (mouth[0] + 10, mouth[1] + 40), tip=TIP_N)
                quick = throw - a < 30
                t_bite = a + (4 if quick else 8)
                if f < t_bite:
                    p['armN'] = lerp(REST, to_mouth, ease_io(seg(f, a, t_bite)))
                elif f < throw - 6:
                    p['armN'] = to_mouth
                    ph = ((f - t_bite) // 4) % 2
                    p['sw_mouth'] = 'mouth smile theeth' if ph == 0 else 'mouth smile'
                elif f < throw:
                    p['armN'] = lerp(to_mouth, (-60.0, 30.0, 0.0), ease_io(seg(f, throw - 6, throw)))
                else:
                    p['armN'] = lerp((-60.0, 30.0, 0.0), (90.0, 0.0, 0.0), ease_out(seg(f, throw, throw + 4))) \
                        if f < throw + 4 else lerp((90.0, 0.0, 0.0), REST, ease_io(seg(f, throw + 4, throw + 10)))
        # смеётся над падениями
        for a, b in ((278, 300), (352, 372)):
            if a <= f < b:
                p['y'] = G - HOV - 6 * (((f - a) // 3) % 2)
                p['sw_mouth'] = 'mouth smile theeth'
                p['head'] = -6.0
        # победа: выплывает в центр
        if f >= 470:
            t = ease_io(seg(f, 470, 504))
            p['x'] = lerp(LPX, CENTER, t)
            p['y'] = G - HOV - 6 * math.sin(2 * math.pi * (f - 470) / 16) * (1 - seg(f, 496, 504))
            if 544 <= f < 572:
                u = ease_io(min(seg(f, 544, 550), 1 - seg(f, 566, 572)))
                p['armF'] = lerp(REST, (150.0, 15.0, 0.0), u)
                p['armN'] = lerp(REST, (-150.0, -15.0, 0.0), u)
        return p

    def banana_state(self, f):
        """Банан в руке Ла Писа: (x, y, поворот, откушено) или None."""
        for (a, throw) in ((228, 256), (372, 404)):
            if a + 2 <= f < throw:
                p = self.lapeace(f)
                h = self.hand_n(p)
                quick = throw - a < 30
                t_bite = a + (4 if quick else 8)
                eaten = 0.0
                if f >= t_bite + 4:
                    eaten = 0.5
                if f >= t_bite + 12:
                    eaten = 0.9
                return h[0], h[1] - 50, -0.3, eaten
        return None

    def peel_state(self, f):
        """Кожура: (x, y, поворот, масштаб) или None."""
        if f < 256:
            return None
        if f < 270:
            h = self.hand_n(self.lapeace(256))
            x, y = bezier(seg(f, 256, 270), h, ((h[0] + P1) / 2, h[1] - 260), (P1, G))
            return x, y, f * 0.5, 1.0
        if f < S1:
            return P1, G, 0.0, 1.0
        if f < S1 + 18:
            # выстреливает из-под ноги вперёд
            t = ease_out(seg(f, S1 + 2, S1 + 18))
            return lerp(P1 + 30, P2, t), G - 30 * math.sin(math.pi * t), 6 * t, 1.0
        if f < S2:
            return P2, G, 0.0, 1.0
        if f < 356:
            # подлетает и шлёпается лорду на лицо
            face = self.ld.joint(self.lord(356), 'head', (0.10, -0.66))
            t = seg(f, S2 + 2, 356)
            x, y = bezier(t, (P2, G), (P2 - 60, G - 420), face)
            return x, y + 20, 8 * t, 1.0
        if f < 378:
            face = self.ld.joint(self.lord(f), 'head', (0.10, -0.66))
            return face[0], face[1] + 20, -1.4, 1.0
        if f < 396:
            # лорд стряхивает её — улетает влево за кадр
            face = self.ld.joint(self.lord(378), 'head', (0.10, -0.66))
            t = seg(f, 378, 396)
            x, y = bezier(t, face, (300, 200), (-120, 500))
            return x, y, -1.4 - 10 * t, 1.0
        if 404 <= f < 416:
            h = self.hand_n(self.lapeace(404))
            x, y = bezier(seg(f, 404, 416), h, ((h[0] + P3) / 2, h[1] - 160), (P3, G))
            return x, y, f * 0.5, 1.0
        if 416 <= f < S3:
            return P3, G, 0.0, 1.0
        if S3 <= f < 460:
            t = ease_out(seg(f, S3 + 2, 460))
            return lerp(P3 + 30, P3 + 300, t), G - 120 * math.sin(math.pi * t), 12 * t, 1.0
        if f >= 460:
            return P3 + 300, G, 0.0, 1.0
        return None

    # ================================================================ кадр
    def draw(self, ctx, f):
        ctx.save()
        self.cam.apply(ctx, f)
        ctx.set_source_surface(self.bg, -bg.M, -bg.M)
        ctx.paint()
        self.clouds.draw(ctx, f)

        ball, ld, lp = self.ball(f), self.lord(f), self.lapeace(f)
        green = (0.1, 0.35, 0.05)
        if ball:
            fx.shadow(ctx, ball['x'], G + 4, 250 * ball.get('scale', 1.0) * ball['sx'], G - ball['y'], green)
        if ld:
            lying = abs(ld.get('rot', 0.0)) > 30
            fx.shadow(ctx, ld['x'], G + 6, 820 if lying else 290, max(0.0, G - 120 - ld['y'] + self.half) if lying else 0, green)
        fx.shadow(ctx, lp['x'], G + 4, 230, 10, green)

        if 186 <= f < 204:
            fx.rays(ctx, LX, G - 160, f, r=230 + 60 * seg(f, 186, 200), alpha=seg(f, 186, 190))

        pl = self.peel_state(f)
        on_ground = pl and pl[1] >= G - 1
        if on_ground:
            peel(ctx, pl[0], pl[1], pl[2], 1.5)
        if ball:
            self.lb_r.draw(ctx, ball)
        if ld:
            self.ld.draw(ctx, ld)
        self.lp.draw(ctx, lp)
        b = self.banana_state(f)
        if b:
            banana(ctx, b[0], b[1], b[2], 1.5, b[3])
        if pl and not on_ground:
            peel(ctx, pl[0], pl[1], pl[2], 1.5)
        self.effects(ctx, f, ball, ld, lp)
        ctx.restore()
        fx.flash(ctx, self.cam.flash_alpha(f))

    def effects(self, ctx, f, ball, ld, lp):
        fx.dust(ctx, LB, G, f - 30, n=4, spread=60, size=0.5, seed=1)
        fx.dust(ctx, LB, G, f - 52, n=4, spread=60, size=0.5, seed=2)
        fx.dust(ctx, 800, G, f - 110, n=4, spread=80, size=0.6, seed=3)
        fx.dust(ctx, 1080, G, f - 124, n=4, spread=80, size=0.6, seed=4)
        fx.spark(ctx, *self.slap_pt(), f - 132, 0.9)
        fx.dust(ctx, LX, G, f - 158, n=6, spread=140, seed=5)
        if ball and 162 <= f < 186:
            fx.dizzy(ctx, ball['x'], G - 330, f - 162, rx=95)
        if ball and 172 <= f < 200:
            fx.anger(ctx, ball['x'] + 95, G - 270, f, 1.2)
            fx.steam(ctx, ball['x'], G - 300, f - 172, 1.1)
        fx.smoke(ctx, LX, 640, f - 200, size=1.5, seed=5)
        if 208 <= f < 224:
            top = self.lp.joint(lp, 'head', (0.04, -0.96))
            fx.sweat(ctx, top[0] - 110, top[1] + 90, f - 208, 1.1, side=-1)
        # скольжения
        fx.whoosh(ctx, P1 + 60, G - 30, f - (S1 + 2), 1.0, trail=-1)
        fx.dust(ctx, P1, G, f - S1, n=4, spread=90, size=0.6, seed=6)
        if ld and S1 + 4 <= f < S1 + 22:
            top = self.ld.joint(ld, 'head', (0.0, -0.98))
            fx.sweat(ctx, top[0] + 120, top[1] + 90, f - S1, 1.2)
        if ld and 306 <= f < 330:
            top = self.ld.joint(ld, 'head', (0.0, -0.98))
            fx.anger(ctx, top[0] - 70, top[1] + 110, f, 1.3)
            fx.steam(ctx, top[0], top[1] + 30, f - 306, 1.2)
        fx.whoosh(ctx, P2 + 60, G - 30, f - (S2 + 2), 1.2, trail=-1)
        fx.dust(ctx, W2 - 150, G, f - 350, n=8, spread=260, size=1.1, seed=7)
        if ld and 356 <= f < 382:
            head = self.ld.joint(ld, 'head', (0.0, -0.66))
            fx.dizzy(ctx, head[0], head[1] - 150, f - 356, rx=90)
        fx.whoosh(ctx, P3 + 60, G - 30, f - (S3 + 2), 1.5, trail=-1)
        fx.dust(ctx, KO_X, G, f - 450, n=10, spread=360, size=1.3, seed=8)
        if ld and f >= 456:
            head = self.ld.joint(ld, 'head', (0.0, -0.66))
            fx.dizzy(ctx, head[0], head[1] - 150, f - 456, rx=100)
        if f >= 548:
            for i, (dx, dy, ph) in enumerate(((-300, -600, 0), (300, -660, 7), (-380, -320, 13),
                                               (400, -380, 4), (-180, -760, 10), (240, -180, 16))):
                fx.twinkle(ctx, CENTER + dx, G + dy, (f - 548 + ph * 2) % 26, 0.9, dur=22)
