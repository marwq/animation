"""Скелет против Ла Писа: тучка на верёвочке. Деревня, день. 25 с = 600 кадров.

 0–4 с      стойка по краям, смотрят друг на друга: скелет-шарик зло подпрыгивает,
            Ла Пис самодовольно гладит бороду
 4–6.5 с    шарик прыжками несётся на Ла Писа — тот останавливает его ладонью
            за лоб, гладит бороду и щелчком отправляет обратно
 6.5–10 с   скелет злится → ухмылка, лучи → дым → крылатый скелет; Ла Пис пугается
 10–13 с    скелет идёт на него; Ла Пис достаёт из-за спины тучку на верёвочке
            и отправляет её скелету на голову — ливень, крылья мокрые и обвисли
 13–16 с    скелет злится, хватает тучку, идёт к Ла Пису и выжимает её над ним —
            ливень и молния: Ла Пис в саже, дымится и падает на спину
 16–25 с    скелет стряхивает воду, расправляет крылья и празднует в центре
"""
import math
import random

import bg
import fx
from anim import Camera, ball_squash, hop, lerp, pose_keys, seg, walk
from fx import ease_in, ease_io, ease_out
from rig import GROUND_Y as G, LA_PEACE, SKELETON_BIG, Ball, Big

LPX = 440                       # Ла Пис
HOV = 14
SB = 1480                       # скелет-шарик в стойке
SK = 1350                       # где появляется большой скелет
SK2 = 1180                      # подошёл
SK3 = 900                       # подошёл к Ла Пису с тучкой
CENTER = 960
REST = (0.0, 0.0, 0.0)
TIP_LP = (0.252, 0.50)
TIP_N = (-0.344, 0.47)
BEARD_LP = (0.10, -0.05)
CLAW = (0.238, 0.587)
STOP, FLICK, BOLT = 134, 154, 432
R = 150


def tremble(f, amp, seed=0):
    return random.Random(f * 31 + seed).uniform(-amp, amp)


def bezier(t, p0, p1, p2):
    u = 1 - t
    return (u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0],
            u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1])


def cloud(ctx, x, y, sx=1.0, sy=1.0, rot=0.0, dark=True, alpha=1.0):
    """Тучка: серые клубы с обводкой; (x, y) — центр."""
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(rot)
    ctx.scale(sx, sy)
    blobs = [(-62, 8, 40), (-22, -16, 50), (30, -12, 46), (66, 10, 36), (0, 18, 44)]
    ctx.push_group()
    ctx.set_line_width(7)
    for bx, by, r in blobs:
        ctx.new_sub_path()
        ctx.arc(bx, by, r, 0, 2 * math.pi)
    ctx.set_source_rgb(0.18, 0.20, 0.26)
    ctx.stroke_preserve()
    ctx.set_source_rgb(*((0.58, 0.61, 0.68) if dark else (0.95, 0.96, 0.98)))
    ctx.fill()
    for bx, by, r in blobs[1:3]:
        ctx.new_sub_path()
        ctx.arc(bx - r * 0.2, by - r * 0.25, r * 0.45, 0, 2 * math.pi)
    ctx.set_source_rgb(*((0.70, 0.73, 0.79) if dark else (1, 1, 1)))
    ctx.fill()
    ctx.pop_group_to_source()
    ctx.paint_with_alpha(alpha)
    ctx.restore()


def rain(ctx, x0, x1, y0, y1, f, dens=1.0, seed=0):
    """Косые капли дождя от y0 до y1 в полосе x0..x1."""
    rng = random.Random(seed)
    n = int((x1 - x0) / 11 * dens)
    ctx.set_source_rgba(0.20, 0.50, 0.92, 0.95)
    ctx.set_line_width(6)
    ctx.set_line_cap(1)
    span = max(1.0, y1 - y0)
    for i in range(n):
        x = x0 + (x1 - x0) * rng.random()
        ph = rng.random() * span
        y = y0 + (ph + f * 38) % span
        ln = 40
        if y + 6 >= y1:
            continue
        ctx.move_to(x, y)
        ctx.line_to(x - 6, min(y + ln, y1))
    ctx.stroke()
    # брызги внизу
    for i in range(n // 3):
        x = x0 + (x1 - x0) * rng.random()
        k = ((f + i * 3) % 6) / 6
        ctx.save()
        ctx.translate(x, y1)
        ctx.scale(10 * (0.5 + k), 4 * (0.5 + k))
        ctx.arc(0, 0, 1, math.pi, 2 * math.pi)
        ctx.restore()
        ctx.set_source_rgba(0.55, 0.78, 1.0, 1 - k)
        ctx.set_line_width(2.5)
        ctx.stroke()


def bolt(ctx, a, b, f, seed=0):
    """Молния-зигзаг от a до b."""
    rng = random.Random(seed + f // 2)
    n = 7
    pts = [a]
    for i in range(1, n):
        t = i / n
        pts.append((lerp(a[0], b[0], t) + rng.uniform(-40, 40), lerp(a[1], b[1], t)))
    pts.append(b)
    for w, col in ((22, (0.08, 0.05, 0.05)), (14, (1.0, 0.86, 0.15)), (5, (1, 1, 0.92))):
        ctx.move_to(*pts[0])
        for p in pts[1:]:
            ctx.line_to(*p)
        ctx.set_source_rgb(*col)
        ctx.set_line_width(w)
        ctx.set_line_join(0)
        ctx.stroke()


class Film:
    frames = 600

    def __init__(self):
        self.bg = bg.meadow('village', seed=91)
        self.clouds = bg.Clouds(seed=88)
        self.sb_r = Ball('skeleton_small')
        self.sk = Big(SKELETON_BIG)
        self.lp = Big(LA_PEACE)
        self.lp_half = (LA_PEACE['sole'] - LA_PEACE['top']) * self.lp.k / 2
        self._cache = {}
        c = self.cam = Camera()
        c.shake(STOP, 6, 6); c.punch(STOP, 10, 0.05, self.palm_pt())
        c.shake(FLICK, 6, 8)
        c.shake(176, 6, 6)
        c.flash(236, 3, 0.45); c.shake(236, 7, 10); c.punch(236, 10, 0.05, (SK, 600))
        c.flash(BOLT, 4, 0.45); c.shake(BOLT, 20, 24); c.punch(BOLT, 14, 0.09, (LPX, 450))
        c.flash(BOLT + 5, 2, 0.4)
        c.shake(462, 10, 12)

    def _memo(self, key, fn):
        if key not in self._cache:
            self._cache[key] = fn()
        return self._cache[key]

    # ================================================================ скелет-шарик
    def palm_pt(self):
        """Где ладонь Ла Писа встречает лоб шарика."""
        def calc():
            p = dict(self.STAND_LP)
            return self.lp.joint(p, 'head', (0.62, -0.22))
        return self._memo('palm', calc)

    def ball(self, f):
        key = ('b', f)
        if key not in self._cache:
            self._cache[key] = self._ball(f)
        return self._cache[key]

    def _ball(self, f):
        if f >= 238:
            return None
        p = dict(dir=-1, face_shift=0.12, eyes='angry', mouth='theeth smile')
        x, lift, sx, sy, rot = SB, 0.0, 1.0, 1.0, 0.0
        for a in (24, 46):
            if a - 4 <= f < a + 12:
                _, lift = hop(f, a, a + 8, SB, SB, 50)
                sx, sy = ball_squash(f, a, a + 8, 4, 4)
        palm = self.palm_pt()
        cx = palm[0] + R * 0.78
        if 96 <= f < 126:
            if f < 112:
                x, lift = hop(f, 98, 110, SB, 1150, 80)
                sx, sy = ball_squash(f, 98, 110, 2, 2)
            else:
                x, lift = hop(f, 112, 124, 1150, 860, 70)
                sx, sy = ball_squash(f, 112, 124, 2, 2)
        elif 126 <= f < STOP:
            t = ease_in(seg(f, 126, STOP))
            x = lerp(860, cx, t)
            lift = lerp(0, G - palm[1] - R, t)
            sx, sy = 0.85, 1.15
        elif STOP <= f < FLICK:
            # застрял на ладони — дрожит
            x = cx + tremble(f, 3)
            lift = G - palm[1] - R
            sx, sy = (0.78, 1.2) if f < STOP + 3 else (0.9, 1.08)
            p.update(eyes='normal', mouth='puzzlement', eye_s=(1.3, 1.3))
        elif FLICK <= f < 176:
            t = seg(f, FLICK, 176)
            x = lerp(cx, SK, ease_out(t))
            lift = (1 - t) * (G - palm[1] - R) + 4 * 320 * t * (1 - t)
            rot = 720 * ease_out(t)
            p.update(eyes='sad', mouth='puzzlement')
        elif f >= 176:
            x = SK
            if f < 178:
                sx, sy = 1.35, 0.65
            elif f < 186:
                t = seg(f, 178, 186)
                lift = 40 * 4 * t * (1 - t)
            p.update(eyes='sad', mouth='puzzlement')
            if f >= 200:
                p.update(eyes='angry')
                x += tremble(f, 2)
            if f >= 222:
                p['mouth'] = 'theeth smile'
                x += tremble(f, 6, 1)
                p['scale'] = lerp(1.0, 1.1, seg(f, 222, 236))
        p.update(x=x, y=G - lift, sx=sx, sy=sy, rot=rot)
        return p

    # ================================================================ Ла Пис
    STAND_LP = dict(x=LPX, y=G - HOV, dir=1, lean=0.0, head=0.0, armF=REST, armN=REST,
                    sw_mouth='mouth smile', eyes=(1.0, 1.0), scale=1.0)

    def lapeace(self, f):
        key = ('lp', f)
        if key not in self._cache:
            self._cache[key] = self._lapeace(f)
        return self._cache[key]

    def _lapeace(self, f):
        lp = self.lp
        keys = [
            (0, dict(self.STAND_LP)),
            (240, {}), (244, dict(eyes=(1.3, 1.3), sw_mouth='mouth sad')),
            (262, {}), (266, dict(eyes=(1.0, 1.0), sw_mouth='mouth smile theeth')),
            (318, {}), (322, dict(sw_mouth='mouth smile theeth')),
            (390, {}), (396, dict(eyes=(1.3, 1.3), sw_mouth='mouth sad', head=-12.0)),
        ]
        p = pose_keys(f, keys)
        # гладит бороду
        for a, b in ((40, 80), (138, 150), (322, 352)):
            if a - 6 <= f < b + 6:
                q = dict(p, armN=REST)
                beard = lp.joint(q, 'head', BEARD_LP)
                stroke = beard[0], beard[1] + 14 * math.sin(2 * math.pi * (f - a) / 10)
                tgt = lp.arm_ik(q, 'N', stroke, tip=(-0.344, 0.45))
                p['armN'] = lerp(REST, tgt, ease_io(min(seg(f, a - 6, a), 1 - seg(f, b, b + 6))))
        # ладонь навстречу шарику, щелчок
        if 120 <= f < 166:
            hold = lp.arm_ik(dict(p, armF=REST), 'F', self.palm_pt(), tip=TIP_LP)
            back = (hold[0] - 25, hold[1] + 30, 0.0)
            if f < 128:
                p['armF'] = lerp(REST, hold, ease_out(seg(f, 120, 128)))
            elif f < FLICK - 4:
                p['armF'] = hold
            elif f < FLICK - 1:
                p['armF'] = lerp(hold, back, ease_out(seg(f, FLICK - 4, FLICK - 1)))
            elif f < FLICK + 2:
                p['armF'] = lerp(back, (hold[0] + 15, hold[1] - 10, 0.0), ease_in(seg(f, FLICK - 1, FLICK + 2)))
            else:
                p['armF'] = lerp((hold[0] + 15, hold[1] - 10, 0.0), REST, ease_io(seg(f, FLICK + 2, 166)))
        # тучка: из-за спины — вверх — толчок к скелету
        if 266 <= f < 304:
            if f < 274:
                p['armF'] = lerp(REST, (-50.0, 30.0, 0.0), ease_io(seg(f, 266, 274)))
            elif f < 290:
                p['armF'] = lerp((-50.0, 30.0, 0.0), (150.0, 10.0, 0.0), ease_io(seg(f, 274, 290)))
            elif f < 296:
                p['armF'] = lerp((150.0, 10.0, 0.0), (95.0, 0.0, 0.0), ease_out(seg(f, 290, 296)))
            else:
                p['armF'] = lerp((95.0, 0.0, 0.0), REST, ease_io(seg(f, 296, 304)))
        # над ним тучка — смотрит вверх
        if 396 <= f < BOLT:
            p['face_shift'] = 0.0
            p['eyes'] = (1.3, 1.3)
        # молния: в саже, падает на спину
        if f >= BOLT:
            p.update(sw_mouth='mouth sad', eyes=(1.0, 0.25), head=0.0, soot=True,
                     armF=(150.0, 30.0, 0.0), armN=(-150.0, -30.0, 0.0))
            if f < BOLT + 12:
                p['y'] = G - HOV + tremble(f, 6)
                p['x'] = LPX + tremble(f, 6, 2)
            elif f < 462:
                t = ease_in(seg(f, BOLT + 12, 462))
                p['rot'] = -90 * t
                cy = lerp(G - HOV - self.lp_half, G - 128, t)
                p['y'] = cy + self.lp_half
                p['x'] = LPX - 60 * t
            else:
                bounce = 14 * math.sin(math.pi * seg(f, 462, 468))
                p.update(rot=-90.0, x=LPX - 60, y=G - 128 - bounce + self.lp_half,
                         armF=(-10.0, 10.0, 0.0), armN=(10.0, 10.0, 0.0))
        return p

    # ================================================================ большой скелет
    STAND = dict(x=SK, dir=-1, wings=20.0, hip=(0.0, 0.0), lean=0.0, head=0.0,
                 armF=REST, armN=REST, footF=(0.0, 0.0), footN=(0.0, 0.0),
                 eyes=(1.0, 0.6), mouth=(1.0, 1.0), face_shift=0.035, scale=1.0, y=G)
    WET = dict(wings=-100.0, hip=(0.0, 0.22), lean=-8.0, head=12.0, eyes=(1.0, 0.45),
               armF=(10.0, 40.0, 0.0), armN=(-10.0, 40.0, 0.0))

    def skel(self, f):
        key = ('sk', f)
        if key not in self._cache:
            self._cache[key] = self._skel(f)
        return self._cache[key]

    def _skel(self, f):
        if f < 236:
            return None
        sk = self.sk
        keys = [
            (236, dict(self.STAND, scale=0.55), 'lin'),
            (240, dict(scale=1.1)), (243, dict(scale=0.96)), (246, dict(scale=1.0)),
            (256, dict(wings=40.0, eyes=(1.0, 0.5))),
            # ливень: съёжился, крылья обвисли
            (308, {}), (316, dict(self.WET)),
            (352, {}), (360, dict(hip=(0.0, 0.0), lean=0.0, head=0.0, eyes=(1.0, 0.4), armF=REST, armN=REST)),
        ]
        p = pose_keys(f, keys)
        w = walk(f, 260, SK, SK2, 2, 10, sk, -1, arm=10.0)
        if w:
            p.update(w)
        elif f >= 260:
            p['x'] = SK2
        if 330 <= f < 352:
            p['x'] = SK2 + tremble(f, 3)          # дрожит от холода
        # хватает тучку и несёт к Ла Пису, выжимает
        if 360 <= f < 440:
            c0 = self.cloud_pos(f)
            q = dict(p, armF=REST, armN=REST)
            w = walk(f, 372, SK2, SK3, 3, 8, sk, -1, arm=0.0)
            if w:
                p.update({k: v for k, v in w.items() if not k.startswith('arm')})
                q.update({k: v for k, v in w.items() if not k.startswith('arm')})
            elif f >= 372:
                p['x'] = q['x'] = SK3
            grabF = sk.arm_ik(q, 'F', (c0[0] - 60, c0[1] + 40), tip=CLAW, bend=-1)
            grabN = sk.arm_ik(q, 'N', (c0[0] + 60, c0[1] + 40), tip=(-0.173, 0.609), bend=-1)
            t = ease_io(seg(f, 360, 368))
            p['armF'] = lerp(REST, grabF, t)
            p['armN'] = lerp(REST, grabN, t)
            p['eyes'] = (1.0, 0.4)
            if 404 <= f < 432:
                p['x'] += tremble(f, 2)
        if f >= 440:
            # стряхивает воду, расправляет крылья, к зрителю, победа
            p['x'] = SK3
            p['armF'] = lerp(self._skel_last_arms('F'), REST, ease_io(seg(f, 440, 450)))
            p['armN'] = lerp(self._skel_last_arms('N'), REST, ease_io(seg(f, 440, 450)))
            p['eyes'] = (1.0, 1.0)
            p['wings'] = -100.0
            if 470 <= f < 494:
                p['wings'] = 20 + 35 * math.sin(2 * math.pi * (f - 470) / 6)
                p['x'] = SK3 + tremble(f, 4)
            elif f >= 494:
                p['wings'] = 20.0
        w = walk(f, 500, SK3, CENTER + 60, 2, 9, sk, -1)
        if w:
            p.update(w)
        elif f >= 500:
            p['x'] = CENTER + 60
        if f >= 528:
            p['face_shift'] = lerp(0.035, -0.03, seg(f, 528, 532))
        if f >= 534:
            t = ease_io(seg(f, 534, 542))
            pump = sum(math.sin(math.pi * seg(f, a, a + 10)) for a in (556, 576))
            p['armF'] = lerp(REST, (136.0 + 10 * pump, 15.0, 0.0), t)
            p['armN'] = lerp(REST, (-136.0 - 10 * pump, -15.0, 0.0), t)
            p['wings'] = lerp(20.0, 6.0, t) + 10 * pump
        return p

    def _skel_last_arms(self, side):
        return self._memo(('arms', side), lambda: self.skel(439)['arm' + side])

    # ================================================================ тучка
    def cloud_pos(self, f):
        """Центр тучки, масштаб (sx, sy), поворот; None — нет тучки."""
        hand = lambda ff: self.lp.joint(self.lapeace(ff), 'F3', TIP_LP)
        if f < 270:
            return None
        if f < 290:
            # поднимается из-за спины Ла Писа
            h = hand(290)
            t = ease_out(seg(f, 270, 290))
            return (lerp(LPX - 60, h[0] + 40, t), lerp(G - 300, h[1] - 170, t), 1.0, 1.0, 0.0)
        over = (SK2 - 20, 112)
        if f < 308:
            h = hand(290)
            t = ease_io(seg(f, 292, 308))
            start = (h[0] + 40, h[1] - 170)
            x, y = bezier(t, start, ((start[0] + over[0]) / 2, start[1] - 120), over)
            return (x, y, 1.0, 1.0, 0.0)
        if f < 360:
            return (over[0] + 8 * math.sin(f * 0.3), over[1], 1.0, 1.0, 0.0)
        target = (LPX + 30, 290)
        if f < 404:
            t = ease_io(seg(f, 368, 404))
            x, y = lerp(over[0], target[0], t), lerp(over[1], target[1], t) - 60 * math.sin(math.pi * t)
            return (x, y, 1.0, 1.0, 0.0)
        if f < BOLT + 2:
            t = ease_in(seg(f, 404, 428))
            return (target[0], target[1], lerp(1.0, 0.55, t), lerp(1.0, 0.8, t), 0.25 * math.sin(f * 0.8) * t)
        if f < 470:
            t = seg(f, BOLT + 2, 470)
            return (target[0] + 300 * t, target[1] - 260 * t, 0.5, 0.5, 0.0)
        return None

    def string_end(self, f):
        """Нижний конец верёвочки: в руке Ла Писа или болтается."""
        c = self.cloud_pos(f)
        if c is None:
            return None
        if f < 296:
            return self.lp.joint(self.lapeace(f), 'F3', TIP_LP)
        sway = 20 * math.sin(f * 0.25)
        return (c[0] + sway, c[1] + 170)

    # ================================================================ кадр
    def draw(self, ctx, f):
        ctx.save()
        self.cam.apply(ctx, f)
        ctx.set_source_surface(self.bg, -bg.M, -bg.M)
        ctx.paint()
        self.clouds.draw(ctx, f)

        ball, sk, lp = self.ball(f), self.skel(f), self.lapeace(f)
        green = (0.1, 0.35, 0.05)
        if ball:
            fx.shadow(ctx, ball['x'], G + 4, 250 * ball.get('scale', 1.0) * ball['sx'], G - ball['y'], green)
        if sk:
            fx.shadow(ctx, sk['x'], G + 6, 300 * sk['scale'], 0, green)
        lying = abs(lp.get('rot', 0.0)) > 30
        fx.shadow(ctx, lp['x'], G + 4, 500 if lying else 230, 10, green)

        if 222 <= f < 238:
            fx.rays(ctx, SK, G - 160, f, r=230 + 60 * seg(f, 222, 236), alpha=seg(f, 222, 226))

        c = self.cloud_pos(f)
        behind = c is not None and f < 284
        if behind:
            self.draw_cloud(ctx, f, c)
        if ball:
            self.sb_r.draw(ctx, ball)
        if sk:
            self.sk.draw(ctx, sk)
        if lp.get('soot'):
            ctx.push_group()
            self.lp.draw(ctx, lp)
            pat = ctx.pop_group()
            ctx.set_source(pat)
            ctx.paint()
            ctx.set_source_rgba(0.12, 0.10, 0.10, 0.62)
            ctx.mask(pat)
        else:
            self.lp.draw(ctx, lp)
        if c is not None and not behind:
            self.draw_cloud(ctx, f, c)
        self.effects(ctx, f, ball, sk, lp, c)
        ctx.restore()
        fx.flash(ctx, self.cam.flash_alpha(f))

    def draw_cloud(self, ctx, f, c):
        x, y, sx, sy, rot = c
        end = self.string_end(f)
        if end and f < BOLT:
            ctx.move_to(x, y + 40 * sy)
            ctx.curve_to(x, y + 100, end[0] + 10, end[1] - 60, *end)
            ctx.set_source_rgb(0.95, 0.95, 0.95)
            ctx.set_line_width(3)
            ctx.stroke()
        dark = f < BOLT + 2
        alpha = 1.0 if f < 450 else 1 - seg(f, 450, 470)
        cloud(ctx, x, y, sx * 1.45, sy * 1.45, rot, dark, alpha)

    def effects(self, ctx, f, ball, sk, lp, c):
        fx.dust(ctx, SB, G, f - 32, n=4, spread=60, size=0.5, seed=1)
        fx.dust(ctx, SB, G, f - 54, n=4, spread=60, size=0.5, seed=2)
        if ball and 60 <= f < 96:
            fx.anger(ctx, SB - 100, G - 270, f, 1.1)
        fx.dust(ctx, 1150, G, f - 110, n=4, spread=80, size=0.6, seed=3)
        fx.dust(ctx, 860, G, f - 124, n=4, spread=80, size=0.6, seed=4)
        fx.spark(ctx, *self.palm_pt(), f - STOP, 0.7)
        if ball and STOP + 2 <= f < FLICK:
            fx.sweat(ctx, ball['x'] + 120, ball['y'] - 270, f - STOP, 1.1)
        fx.spark(ctx, *self.palm_pt(), f - FLICK, 0.9)
        fx.dust(ctx, SK, G, f - 176, n=6, spread=140, seed=5)
        if ball and 180 <= f < 204:
            fx.dizzy(ctx, ball['x'], G - 330, f - 180, rx=95)
        if ball and 200 <= f < 236:
            fx.anger(ctx, ball['x'] - 95, G - 270, f, 1.2)
            fx.steam(ctx, ball['x'], G - 300, f - 200, 1.1)
        fx.smoke(ctx, SK, 640, f - 236, size=1.5, seed=5)
        if 244 <= f < 262:
            top = self.lp.joint(lp, 'head', (0.04, -0.96))
            fx.sweat(ctx, top[0] + 110, top[1] + 90, f - 244, 1.1)
        # ливень на скелета
        if c and 308 <= f < 360:
            x, y = c[0], c[1]
            head = self.sk.joint(sk, 'head', (0.115, -0.83))
            rain(ctx, x - 120, x + 120, y + 70, head[1] + 20, f, 1.0, seed=1)
            rain(ctx, x - 130, x + 130, head[1] + 60, G, f + 5, 0.5, seed=2)
        if sk and 320 <= f < 372:
            head = self.sk.joint(sk, 'head', (0.115, -0.66))
            fx.sweat(ctx, head[0] - 140, head[1], f - 320, 1.2, side=-1)
            fx.sweat(ctx, head[0] + 120, head[1] + 60, f - 326, 1.0)
        if sk and 360 <= f < 380:
            head = self.sk.joint(sk, 'head', (0.115, -0.86))
            fx.anger(ctx, head[0] + 70, head[1] + 60, f, 1.2)
        # выжимает: ливень на Ла Писа, молния
        if c and 404 <= f < BOLT + 6:
            x, y = c[0], c[1]
            top = self.lp.joint(lp, 'head', (0.04, -0.96))
            rain(ctx, x - 90, x + 90, y + 55, top[1] + 10, f, 2.0, seed=3)
            rain(ctx, x - 130, x + 130, top[1] + 40, G, f + 7, 0.7, seed=4)
        if c and BOLT - 2 <= f < BOLT + 8 and (f - BOLT) % 3 != 2:
            top = self.lp.joint(self.lapeace(BOLT - 1), 'head', (0.04, -0.96))
            bolt(ctx, (c[0], c[1] + 45), top, f, seed=5)
        if f >= BOLT:
            head = self.lp.joint(lp, 'head', (0.04, -0.6))
            for k in range(3):
                t = ((f - BOLT + k * 9) % 27) / 27
                fx.puff_cloud(ctx, head[0] + (k - 1) * 30 + 10 * math.sin(f * 0.2 + k), head[1] - 60 - 100 * t,
                              16 + 16 * t, (1 - t) * 0.8, fill=(0.55, 0.55, 0.58), line=(0.3, 0.3, 0.33), seed=k, n=4)
        fx.dust(ctx, LPX - 60, G, f - 462, n=8, spread=280, size=1.1, seed=6)
        if f >= 466:
            head = self.lp.joint(lp, 'head', (0.04, -0.6))
            fx.dizzy(ctx, head[0], head[1] - 120, f - 466, rx=90)
        # стряхивает воду
        if sk and 470 <= f < 494:
            body = self.sk.joint(sk, 'torso', (0.03, -0.1))
            rng = random.Random(f)
            for _ in range(8):
                a = rng.uniform(0, 2 * math.pi)
                d = rng.uniform(160, 300)
                fx.sweat(ctx, body[0] + d * math.cos(a), body[1] + d * math.sin(a) * 0.7, 3, 0.7)
        if f >= 544:
            for i, (dx, dy, ph) in enumerate(((-330, -620, 0), (300, -700, 7), (-420, -300, 13),
                                               (420, -380, 4), (-200, -840, 10), (240, -160, 16))):
                fx.twinkle(ctx, CENTER + 60 + dx, G + dy, (f - 544 + ph * 2) % 26, 0.9, dur=22)
