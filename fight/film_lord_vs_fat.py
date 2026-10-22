"""Лорд против Толстого: торт-приманка. Луг у моря, день. 25 с = 600 кадров.

 0–4 с      стойка по краям, смотрят друг на друга: лорд-шарик самодовольно
            подпрыгивает, толстый хлопает себя по животу
 4–7 с      толстый прыжками к лорду, приседает, дрожит, взлетает и всем весом
            садится на него — лорд в блин; толстый отскакивает и хохочет
 7–10.5 с   лорд отлипает, злится → ухмылка, лучи → дым → большой лорд;
            толстый пугается
 10.5–14 с  лорд достаёт из-за спины торт — у толстого глаза-сердечки и слюнки;
            лорд бросает торт далеко на пенёк
 14–16.5 с  толстый разворачивается и скачет за тортом, раскрывает огромный рот —
            лорд подбегает сзади и пинком отправляет его за кадр
 16.5–25 с  лорд берёт торт с пенька, выходит в центр, откусывает и поднимает
            торт над головой — победа
"""
import math
import random

import cairo

import bg
import fx
from anim import Camera, ball_squash, hop, lerp, pose_keys, seg, walk
from fx import ease_in, ease_io, ease_out
from rig import GROUND_Y as G, LORD_BIG, Ball, Big

LB = 440                        # лорд-шарик
FX0, FX1, FX2 = 1400, 960, 1460  # толстый: стойка, после отскока, у торта
STUMP = (1770, 110)             # пенёк: центр по x и высота
CAKE_ON = (1770, G - 110 - 44)  # центр торта на пеньке
CENTER = 960
REST = (0.0, 0.0, 0.0)
PALM = (0.225, 0.31)
TOE = (0.26, 0.90)              # носок ботинка лорда (нога F)
SLAM, KICK = 160, 392
LP = 1600                       # где лорд берёт торт


def tremble(f, amp, seed=0):
    return random.Random(f * 31 + seed).uniform(-amp, amp)


def turn(f, t0, d0):
    if f < t0:
        return d0, 1.0
    return {t0: (d0, 0.55), t0 + 1: (-d0, 0.3), t0 + 2: (-d0, 0.7)}.get(f, (-d0, 1.0))


def bezier(t, p0, p1, p2):
    u = 1 - t
    return (u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0],
            u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1])


OUT = (0.08, 0.05, 0.05)


def cake(ctx, x, y, s=1.0, bitten=False, rot=0.0):
    """Двухъярусный торт с розовой глазурью и вишенкой; (x, y) — центр."""
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(rot)
    ctx.scale(s, s)
    if bitten:
        ctx.rectangle(-200, -200, 400, 400)
        ctx.arc(-58, -12, 30, 0, 2 * math.pi)
        ctx.set_fill_rule(cairo.FILL_RULE_EVEN_ODD)
        ctx.clip()
        ctx.set_fill_rule(cairo.FILL_RULE_WINDING)

    def tier(x0, y0, w, h, drips):
        ctx.rectangle(x0, y0, w, h)
        ctx.set_source_rgb(0.98, 0.90, 0.72)
        ctx.fill_preserve()
        ctx.set_source_rgb(*OUT)
        ctx.set_line_width(4)
        ctx.stroke()
        ctx.move_to(x0, y0 + 14)
        for k in range(drips):
            dx = w * (k + 0.5) / drips
            ctx.line_to(x0 + dx - 6, y0 + 14)
            ctx.curve_to(x0 + dx - 6, y0 + 30, x0 + dx + 6, y0 + 30, x0 + dx + 6, y0 + 14)
        ctx.line_to(x0 + w, y0 + 14)
        ctx.line_to(x0 + w, y0)
        ctx.line_to(x0, y0)
        ctx.close_path()
        ctx.set_source_rgb(1.0, 0.55, 0.75)
        ctx.fill_preserve()
        ctx.set_source_rgb(*OUT)
        ctx.set_line_width(3)
        ctx.stroke()

    tier(-58, -6, 116, 50, 5)
    tier(-38, -40, 76, 36, 3)
    ctx.arc(0, -50, 11, 0, 2 * math.pi)
    ctx.set_source_rgb(0.85, 0.08, 0.15)
    ctx.fill_preserve()
    ctx.set_source_rgb(*OUT)
    ctx.set_line_width(3)
    ctx.stroke()
    ctx.move_to(2, -60)
    ctx.curve_to(4, -72, 12, -78, 18, -80)
    ctx.stroke()
    ctx.arc(-4, -54, 3, 0, 2 * math.pi)
    ctx.set_source_rgb(1, 1, 1)
    ctx.fill()
    ctx.restore()


def stump(ctx, x, h):
    w = 104
    ctx.move_to(x - w / 2 - 10, G)
    ctx.line_to(x - w / 2, G - h)
    ctx.line_to(x + w / 2, G - h)
    ctx.line_to(x + w / 2 + 10, G)
    ctx.close_path()
    ctx.set_source_rgb(0.55, 0.36, 0.20)
    ctx.fill_preserve()
    ctx.set_source_rgb(*OUT)
    ctx.set_line_width(4)
    ctx.stroke()
    ctx.save()
    ctx.translate(x, G - h)
    ctx.scale(w / 2, 12)
    ctx.arc(0, 0, 1, 0, 2 * math.pi)
    ctx.restore()
    ctx.set_source_rgb(0.86, 0.68, 0.45)
    ctx.fill_preserve()
    ctx.set_source_rgb(*OUT)
    ctx.set_line_width(4)
    ctx.stroke()
    ctx.save()
    ctx.translate(x, G - h)
    ctx.scale(w / 4, 6)
    ctx.arc(0, 0, 1, 0, 2 * math.pi)
    ctx.restore()
    ctx.set_source_rgb(0.62, 0.42, 0.24)
    ctx.set_line_width(0.4)
    ctx.stroke()


class Film:
    frames = 600

    def __init__(self):
        self.bg = bg.meadow('coast', seed=71)
        self.clouds = bg.Clouds(seed=66)
        self.fat_r = Ball('fat')
        self.lb_r = Ball('lord_small')
        self.ld = Big(LORD_BIG)
        self._cache = {}
        eyes = next(l for l in self.fat_r.layers if l.switch == 'eyes' and l.name == 'normal')
        self.eye_pts = []
        for sh in eyes.shapes:
            for loop in sh.loops:
                pts = [g[0] for g in loop]
                self.eye_pts.append((sum(p[0] for p in pts) / len(pts), sum(p[1] for p in pts) / len(pts)))
        self.eye_pts = self.eye_pts[:2]
        c = self.cam = Camera()
        c.shake(SLAM, 16, 20); c.punch(SLAM, 14, 0.08, (LB, G - 80)); c.flash(SLAM, 3, 0.3)
        c.flash(246, 3, 0.45); c.shake(246, 7, 10); c.punch(246, 10, 0.05, (LB, 600))
        c.shake(352, 5, 5)
        c.flash(KICK, 3, 0.35); c.shake(KICK, 14, 16); c.punch(KICK, 12, 0.08, self.kick_pt())

    def _memo(self, key, fn):
        if key not in self._cache:
            self._cache[key] = fn()
        return self._cache[key]

    # ================================================================ толстый
    def fat(self, f):
        key = ('fat', f)
        if key not in self._cache:
            self._cache[key] = self._fat(f)
        return self._cache[key]

    def _fat(self, f):
        if f >= KICK + 22:
            return None
        p = dict(dir=-1, face_shift=0.12, eyes='normal', mouth='theeth smile')
        x, lift, sx, sy, rot = FX0, 0.0, 1.0, 1.0, 0.0
        if 40 <= f < 70:
            t = f - 40
            k = 0.06 * math.sin(2 * math.pi * t / 8) * (1 - t / 30)
            sx, sy = 1 + k, 1 - k
            p['mouth'] = 'happy'
        if f >= 70:
            p['eyes'] = 'angry'
        # прыжки, присед, прыжок и посадка на лорда
        if 96 <= f < 124:
            if f < 110:
                x, lift = hop(f, 98, 110, FX0, 1150, 70)
                sx, sy = ball_squash(f, 98, 110, 2, 2)
            else:
                x, lift = hop(f, 112, 124, 1150, FX1, 70)
                sx, sy = ball_squash(f, 112, 124, 2, 2)
        elif 124 <= f < 136:
            x = FX1 + tremble(f, 3) * (f >= 128)
            t = ease_out(seg(f, 124, 128))
            sx, sy = lerp(1.0, 1.22, t), lerp(1.0, 0.78, t)
        elif 136 <= f < SLAM:
            t = seg(f, 136, SLAM)
            x = lerp(FX1, LB, ease_io(seg(f, 136, 150)))
            if f < 148:
                lift = 400 * ease_out(seg(f, 136, 148))
            elif f < 154:
                lift = 400 + 8 * math.sin(math.pi * seg(f, 148, 154))
            else:
                lift = lerp(400, 75, ease_in(seg(f, 154, SLAM)))
            if f < 139:
                sx, sy = 0.84, 1.18
            p.update(mouth='theeth smile', eyes='angry')
        elif SLAM <= f < 168:
            x, lift = LB, 75
            sx, sy = (1.3, 0.7) if f < SLAM + 3 else (1.1, 0.9)
            p.update(mouth='happy')
        elif 168 <= f < 186:
            x, lift = hop(f, 168, 184, LB, FX1, 140)
            lift += 75 * (1 - seg(f, 168, 184))
            p.update(mouth='happy')
        elif f >= 186:
            x = FX1
            if f < 192:
                sx, sy = ball_squash(f, 180, 184, 0, 8)
        if 188 <= f < 226:
            p.update(mouth='happy', eyes='normal')
            sx, sy = (1.05, 0.95) if ((f - 188) // 4) % 2 == 0 else (0.97, 1.03)
        if 226 <= f < 250:
            p.update(mouth='theeth smile', eyes='normal')
        if 250 <= f < 272:
            p.update(mouth='puzzlement', eyes='normal', eye_s=(1.3, 1.3))
            x += tremble(f, 3)
        elif 272 <= f < 290:
            p.update(mouth='theeth smile', eyes='angry')
        # торт! глаза-сердечки, слюнки
        if 290 <= f < KICK:
            p.update(mouth='happy', eyes='normal', hide=('normal',), hearts=True)
            if f < 330:
                x += tremble(f, 2)
        # разворот и погоня
        d, tsx = turn(f, 334, -1)
        p['dir'] = d
        sx *= tsx
        if 338 <= f < 366:
            if f < 352:
                x, lift = hop(f, 338, 350, FX1, 1180, 90)
                sx2, sy2 = ball_squash(f, 338, 350, 2, 2)
            else:
                x, lift = hop(f, 352, 364, 1180, FX2, 90)
                sx2, sy2 = ball_squash(f, 352, 364, 2, 4)
            sx, sy = sx * sx2, sy * sy2
        elif f >= 366:
            x = FX2
        # огромный рот на торт
        if 368 <= f < KICK:
            o = ease_out(seg(f, 368, 378))
            p.update(mouth_s=(lerp(1.0, 2.0, o),) * 2, mouth_off=(0.0, lerp(0.0, 0.12, o)), eye_dy=-0.05 * o)
        # пинок — улетает за кадр
        if f >= KICK:
            t = seg(f, KICK, KICK + 22)
            x = FX2 + 1000 * ease_out(t)
            lift = 620 * math.sin(math.pi * t * 0.75)
            rot = 720 * t
            p.update(mouth='puzzlement', eyes='sad', hide=(), hearts=False, mouth_s=None, eye_dy=0.0)
            if f < KICK + 3:
                sx, sy = 0.8, 1.15
        p.update(x=x, y=G - lift, sx=sx, sy=sy, rot=rot)
        if not p.get('mouth_s'):
            p.pop('mouth_s', None)
        return p

    def fat_eyes(self, p):
        """Где у толстого глаза (для сердечек) — с учётом поворота лица."""
        r = self.fat_r
        fs = p.get('face_shift', 0.05)
        sq = 1.0 - min(0.18, 1.3 * abs(fs))
        out = []
        for ex, ey in self.eye_pts:
            x = r.cx + fs * 1.3 + sq * (ex - r.cx)
            out.append(r.place(p).transform_point(x, ey + p.get('eye_dy', 0.0)))
        return out

    def kick_pt(self):
        """Левый край толстого на высоте 110 px — сюда попадает носок лорда."""
        def calc():
            p = self.fat(KICK - 1)
            m = self.fat_r.place(p)
            c = cairo.Context(cairo.ImageSurface(cairo.FORMAT_A8, 4, 4))
            c.transform(m)
            self.fat_r._loops_path(c, self.fat_r.layer('body'))
            mi = cairo.Matrix(*m)
            mi.invert()
            y = G - 110
            for x in range(int(p['x']) - 400, int(p['x'])):
                if c.in_fill(*mi.transform_point(x, y)):
                    return (x, y)
            return (p['x'] - 255, y)
        return self._memo('kick', calc)

    # ================================================================ лорд-шарик
    def ball(self, f):
        key = ('b', f)
        if key not in self._cache:
            self._cache[key] = self._ball(f)
        return self._cache[key]

    def _ball(self, f):
        if f >= 250:
            return None
        p = dict(x=LB, dir=1, face_shift=0.12, eyes='angry', mouth='theeth smile')
        x, lift, sx, sy = LB, 0.0, 1.0, 1.0
        for a in (24, 48):
            if a - 4 <= f < a + 12:
                _, lift = hop(f, a, a + 8, LB, LB, 45)
                sx, sy = ball_squash(f, a, a + 8, 4, 4)
        if 136 <= f < SLAM:
            p.update(eyes='normal', mouth='puzzlement', eye_dy=-0.06, eye_s=(1.3, 1.3))
            x += tremble(f, 2)
        if SLAM <= f < 186:
            sx, sy = 1.9, 0.25
            p.update(eyes='sad', mouth='puzzlement')
        elif 186 <= f < 196:
            t = f - 186
            sx, sy = ((1.6, 0.45), (1.3, 0.7), (0.9, 1.15), (0.85, 1.2), (1.08, 0.92), (1.04, 0.97),
                      (1.0, 1.0), (1.0, 1.0), (1.0, 1.0), (1.0, 1.0))[t]
            p.update(eyes='sad', mouth='puzzlement')
        elif 196 <= f < 250:
            p.update(eyes='sad' if f < 206 else 'angry', mouth='puzzlement')
            if f >= 206:
                x += tremble(f, 2)
            if f >= 230:
                p['mouth'] = 'theeth smile'
                x += tremble(f, 6, 1)
                p['scale'] = lerp(1.0, 1.1, seg(f, 230, 246))
        p.update(x=x, y=G - lift, sx=sx, sy=sy)
        return p

    # ================================================================ большой лорд
    STAND = dict(x=LB, dir=1, hip=(0.0, 0.0), lean=0.0, head=0.0, armF=REST, armN=REST,
                 footF=(0.0, 0.0), footN=(0.0, 0.0), eyes=(1.0, 0.6), mouth=(1.0, 1.0),
                 face_shift=0.05, scale=1.0, y=G)

    def lord(self, f):
        key = ('ld', f)
        if key not in self._cache:
            self._cache[key] = self._lord(f)
        return self._cache[key]

    def lk(self):
        """Где стоит лорд, когда пинает."""
        return self.kick_pt()[0] - 175

    def _lord(self, f):
        if f < 246:
            return None
        ld = self.ld
        k = ld.k
        keys = [
            (246, dict(self.STAND, scale=0.55), 'lin'),
            (250, dict(scale=1.1)), (253, dict(scale=0.96)), (256, dict(scale=1.0)),
            (266, dict(eyes=(1.0, 1.0))),
            # рука за спину — достаёт торт
            (268, {}), (276, dict(armF=(-55.0, 40.0, 0.0))),
            (280, {}), (288, dict(armF=(75.0, 25.0, 0.0))),
            # замах и бросок
            (318, {}), (326, dict(armF=(165.0, 35.0, 0.0), lean=-8.0)),
            (327, {}, 'in'), (331, dict(armF=(60.0, 0.0, 0.0), lean=8.0)),
            (338, {}), (344, dict(armF=REST, lean=0.0, eyes=(1.0, 0.55))),
        ]
        p = pose_keys(f, keys)
        # подбегает к толстому
        LK = self.lk()
        w = walk(f, 340, LB, LK, 4, 9, ld, 1, arm=16.0, lift=0.09)
        if w:
            p.update(w)
        elif f >= 340:
            p['x'] = LK
        # пинок
        if KICK - 10 <= f < 410:
            p['x'] = LK
            q = dict(p, footF=(0.0, 0.0), lean=-12.0)
            target = self.kick_pt()
            off = (0.0, 0.0)
            for _ in range(4):
                toe = ld.joint(dict(q, footF=off), 'FL3', TOE)
                off = (off[0] + (target[0] - toe[0]) / k, off[1] + (target[1] - toe[1]) / k)
            back = (-0.22, -0.12)
            if f < KICK - 4:
                t = ease_io(seg(f, KICK - 10, KICK - 4))
                p['footF'] = lerp((0.0, 0.0), back, t)
                p['lean'] = lerp(0.0, 6.0, t)
            elif f < KICK:
                t = ease_in(seg(f, KICK - 4, KICK))
                p['footF'] = lerp(back, off, t)
                p['lean'] = lerp(6.0, -12.0, t)
            elif f < 398:
                p['footF'] = off
                p['lean'] = -12.0
            else:
                t = ease_io(seg(f, 398, 410))
                p['footF'] = lerp(off, (0.0, 0.0), t)
                p['lean'] = lerp(-12.0, 0.0, t)
            p['armF'] = (-40.0, 30.0, 0.0) if f >= KICK - 4 else REST
            p['armN'] = (45.0, 30.0, 0.0) if f >= KICK - 4 else REST
            if 398 <= f < 410:
                u = ease_io(seg(f, 398, 410))
                p['armF'] = lerp((-40.0, 30.0, 0.0), REST, u)
                p['armN'] = lerp((45.0, 30.0, 0.0), REST, u)
            p['eyes'] = (1.0, 0.45)
        # идёт к пеньку
        w = walk(f, 412, LK, LP, 4, 8, ld, 1)
        if w:
            p.update(w)
            p['eyes'] = (1.0, 1.0)
        elif f >= 412:
            p['x'] = LP
        # наклон и торт в руку
        if 448 <= f < 478:
            q = dict(p, x=LP, hip=(0.0, 0.30), lean=30.0, armF=REST, footF=(0.0, 0.0), footN=(0.0, 0.0))
            grab = ld.arm_ik(q, 'F', (CAKE_ON[0] - 30, CAKE_ON[1] + 10), tip=PALM)
            if f < 458:
                t = ease_io(seg(f, 448, 458))
            elif f < 464:
                t = 1.0
            else:
                t = 1 - ease_io(seg(f, 464, 476))
            p['hip'] = (0.0, 0.30 * t)
            p['lean'] = 30.0 * t
            p['armF'] = lerp(REST, grab, t) if f < 464 else lerp((40.0, 70.0, 0.0), grab, t)
            p['footF'], p['footN'] = (0.0, 0.0), (0.0, 0.0)
        # разворот и в центр, торт в руке
        d, sx = turn(f, 478, 1)
        p['dir'], p['sx'] = d, sx
        w = walk(f, 482, LP, CENTER, 4, 9, ld, -1)
        if w:
            p.update(w)
            p['armF'] = (40.0, 70.0, 0.0)
        elif f >= 482:
            p['x'] = CENTER
            p['armF'] = (40.0, 70.0, 0.0)
        # к зрителю, откусывает, торт над головой
        if f >= 524:
            p['face_shift'] = lerp(0.05, -0.03, seg(f, 524, 528))
        if 530 <= f < 562:
            q = dict(p, armF=REST)
            mouth = ld.joint(q, 'face', (0.03, -0.53))
            to_mouth = ld.arm_ik(q, 'F', (mouth[0] - 50, mouth[1] + 30), tip=PALM)
            t = ease_io(min(seg(f, 530, 538), 1 - seg(f, 552, 560)))
            p['armF'] = lerp((40.0, 70.0, 0.0), to_mouth, t)
            if 540 <= f < 552:
                p['mouth'] = (1.0, 0.6 if (f // 3) % 2 else 1.0)
        if f >= 560:
            t = ease_io(seg(f, 560, 568))
            p['armF'] = lerp((40.0, 70.0, 0.0), (150.0, 15.0, 0.0), t)
            p['armN'] = lerp(REST, (-150.0, -15.0, 0.0), t)
        return p

    def cake_state(self, f):
        """(x, y, укушен, поворот) или None."""
        if f < 282 or f >= 600:
            return None
        if f < 331:
            p = self.lord(f)
            h = self.ld.joint(p, 'F3', PALM)
            if f < 284:
                return None
            return h[0], h[1] - 40, False, 0.0
        if f < 352:
            h = self.ld.joint(self.lord(331), 'F3', PALM)
            t = seg(f, 331, 352)
            x, y = bezier(t, (h[0], h[1] - 40), (1300, -60), CAKE_ON)
            return x, y, False, 0.5 * math.sin(t * 6)
        if f < 458:
            return CAKE_ON[0], CAKE_ON[1], False, 0.0
        h = self.ld.joint(self.lord(f), 'F3', PALM)
        return h[0] + 10 * self.lord(f)['dir'], h[1] - 40, f >= 546, 0.0

    # ================================================================ кадр
    def draw(self, ctx, f):
        ctx.save()
        self.cam.apply(ctx, f)
        ctx.set_source_surface(self.bg, -bg.M, -bg.M)
        ctx.paint()
        self.clouds.draw(ctx, f)

        fat, ball, ld = self.fat(f), self.ball(f), self.lord(f)
        green = (0.1, 0.35, 0.05)
        fx.shadow(ctx, STUMP[0], G + 4, 150, 0, green)
        if fat:
            fx.shadow(ctx, fat['x'], G + 4, 470 * abs(fat['sx']), G - fat['y'], green)
        if ball:
            fx.shadow(ctx, ball['x'], G + 4, 250 * ball.get('scale', 1.0) * ball['sx'], G - ball['y'], green)
        if ld:
            fx.shadow(ctx, ld['x'], G + 6, 290 * ld['scale'], 0, green)

        if 230 <= f < 248:
            fx.rays(ctx, LB, G - 160, f, r=230 + 60 * seg(f, 230, 246), alpha=seg(f, 230, 234))

        stump(ctx, *STUMP)
        ck = self.cake_state(f)
        held = ck and (f >= 458 or f < 331)
        if ck and not held:
            cake(ctx, ck[0], ck[1], 1.0, ck[2], ck[3])
        if ball:
            self.lb_r.draw(ctx, ball)
        if fat:
            self.fat_r.draw(ctx, fat)
            if fat.get('hearts'):
                beat = 1 + 0.15 * math.sin(f * 0.8)
                for ex, ey in self.fat_eyes(fat):
                    fx.heart(ctx, ex, ey, 26 * beat)
        if ld:
            self.ld.draw(ctx, ld)
        if held:
            cake(ctx, ck[0], ck[1], 1.0, ck[2], ck[3])
        self.effects(ctx, f, fat, ball, ld)
        ctx.restore()
        fx.flash(ctx, self.cam.flash_alpha(f))

    def effects(self, ctx, f, fat, ball, ld):
        fx.dust(ctx, LB, G, f - 32, n=4, spread=60, size=0.5, seed=1)
        fx.dust(ctx, LB, G, f - 56, n=4, spread=60, size=0.5, seed=2)
        fx.dust(ctx, 1150, G, f - 110, n=4, spread=90, size=0.7, seed=3)
        fx.dust(ctx, FX1, G, f - 124, n=4, spread=90, size=0.7, seed=4)
        fx.dust(ctx, LB, G, f - SLAM, n=10, spread=340, size=1.3, seed=5)
        if ball and SLAM + 4 <= f < 200:
            fx.dizzy(ctx, LB, G - 130, f - SLAM, rx=120)
        fx.dust(ctx, FX1, G, f - 184, n=6, spread=150, size=0.9, seed=6)
        if ball and 206 <= f < 246:
            fx.anger(ctx, ball['x'] + 95, G - 270, f, 1.2)
            fx.steam(ctx, ball['x'], G - 300, f - 206, 1.1)
        fx.smoke(ctx, LB, 640, f - 246, size=1.5, seed=5)
        if fat and 250 <= f < 272:
            fx.sweat(ctx, fat['x'] + 150, G - 400, f - 250, 1.2)
        # слюнки и сердечки над толстым
        if fat and 292 <= f < KICK:
            m = self.fat_r.point(fat, (0.20, 0.27), face=True)
            fx.drool(ctx, m[0], m[1], f, 1.3)
            fx.hearts_up(ctx, fat['x'], G - 480 + (G - fat['y']), f, 3, 1.1)
        fx.dust(ctx, 1180, G, f - 350, n=4, spread=90, size=0.7, seed=7)
        fx.dust(ctx, FX2, G, f - 364, n=4, spread=90, size=0.7, seed=8)
        # пинок
        fx.spark(ctx, *self.kick_pt(), f - KICK, 1.2)
        fx.twinkle(ctx, 1880, 160, f - (KICK + 18), 1.4, dur=22)
        if f >= 568:
            for i, (dx, dy, ph) in enumerate(((-330, -620, 0), (300, -700, 7), (-420, -300, 13),
                                               (420, -380, 4), (-200, -840, 10), (240, -160, 16))):
                fx.twinkle(ctx, CENTER + dx, G + dy, (f - 568 + ph * 2) % 26, 0.9, dur=22)
