"""Малыш против Скелета: жвачка. Луг с мельницами и тюльпанами, день. 25 с = 600 кадров.

 0–4 с      стойка по краям, смотрят друг на друга: малыш жуёт жвачку,
            скелет-шарик зло подпрыгивает
 4–8 с      малыш выдувает пузырь — пузырь поднимает его в воздух, он плывёт
            над скелетом и дразнится
 8–9.5 с    пузырь лопается малышу на лицо, он падает прямо на скелета —
            скелет расплющен в блин
 9.5–12.5 с малыш отдирает жвачку и улетает назад; скелет надувается, злится →
            ухмылка, лучи → дым → крылатый скелет; малыш пугается
 12.5–16.5 с малыш жуёт и дует огромный пузырь, скелет летит на него —
            влетает в пузырь, тот смыкается вокруг; малыш откусывает жвачку
 16.5–19 с  пузырь со скелетом внутри уносит в небо
 19–25 с    малыш в центре: надувает маленький пузырь, тот лопается на носу,
            малыш хохочет и радуется
"""
import math
import random

import bg
import fx
from anim import Camera, ball_squash, hop, lerp, pose_keys, seg
from fx import ease_in, ease_io, ease_out
from rig import GROUND_Y as G, SKELETON_BIG, Ball, Big

BX = 440                        # малыш в стойке
SX = 1480                       # скелет
BX2 = 520                       # малыш после отступления
CENTER = 960
R_BALL = 150
GUM = (1.0, 0.50, 0.75)
GUM_D = (0.62, 0.16, 0.40)


def tremble(f, amp, seed=0):
    return random.Random(f * 31 + seed).uniform(-amp, amp)


def bubble(ctx, x, y, r, alpha=0.88, sx=1.0, sy=1.0):
    """Пузырь жвачки: розовый, с обводкой и бликом."""
    if r <= 1:
        return
    ctx.save()
    ctx.translate(x, y)
    ctx.scale(sx, sy)
    ctx.arc(0, 0, r, 0, 2 * math.pi)
    ctx.set_source_rgba(*GUM, alpha)
    ctx.fill_preserve()
    ctx.set_source_rgba(*GUM_D, 1.0)
    ctx.set_line_width(max(3.0, r * 0.035))
    ctx.stroke()
    ctx.save()
    ctx.translate(-r * 0.42, -r * 0.45)
    ctx.rotate(-0.7)
    ctx.scale(r * 0.26, r * 0.12)
    ctx.arc(0, 0, 1, 0, 2 * math.pi)
    ctx.restore()
    ctx.set_source_rgba(1, 1, 1, 0.8)
    ctx.fill()
    ctx.arc(-r * 0.12, -r * 0.62, r * 0.05, 0, 2 * math.pi)
    ctx.fill()
    ctx.restore()


def gum_splat(ctx, x, y, r, seed=0, alpha=1.0):
    """Лопнувшая жвачка на лице: неровная клякса с подтёками."""
    if r <= 2:
        return
    rng = random.Random(seed)
    n = 14
    pts = []
    for i in range(n):
        a = 2 * math.pi * i / n
        rr = r * rng.uniform(0.78, 1.12)
        pts.append((x + rr * math.cos(a), y + rr * math.sin(a) * 0.8))
    ctx.save()
    ctx.move_to(*pts[0])
    for i in range(n):
        p0, p1 = pts[i], pts[(i + 1) % n]
        mx, my = (p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2
        ctx.curve_to(p0[0], p0[1], mx, my, p1[0], p1[1])
    ctx.close_path()
    for k in range(3):
        dx = (k - 1) * r * 0.45
        ctx.new_sub_path()
        ctx.move_to(x + dx - r * 0.1, y + r * 0.6)
        ctx.line_to(x + dx - r * 0.07, y + r * (1.0 + 0.2 * k))
        ctx.arc_negative(x + dx, y + r * (1.0 + 0.2 * k), r * 0.08, math.pi, 0)
        ctx.line_to(x + dx + r * 0.1, y + r * 0.6)
        ctx.close_path()
    ctx.set_source_rgba(*GUM, alpha)
    ctx.fill_preserve()
    ctx.set_source_rgba(*GUM_D, alpha)
    ctx.set_line_width(4)
    ctx.stroke()
    ctx.arc(x - r * 0.4, y - r * 0.3, r * 0.12, 0, 2 * math.pi)
    ctx.set_source_rgba(1, 1, 1, 0.7 * alpha)
    ctx.fill()
    ctx.restore()


class Film:
    frames = 600

    def __init__(self):
        self.bg = bg.meadow('windmill', seed=51)
        self.clouds = bg.Clouds(seed=44)
        self.baby_r = Ball('child')
        self.sb_r = Ball('skeleton_small')
        self.sk = Big(SKELETON_BIG)
        self.half = (SKELETON_BIG['sole'] - SKELETON_BIG['top']) * self.sk.k / 2
        self._cache = {}
        c = self.cam = Camera()
        c.shake(30, 4, 4); c.shake(48, 4, 4)
        c.flash(200, 3, 0.3); c.shake(200, 6, 6)
        c.shake(214, 12, 14); c.punch(214, 12, 0.07, (SX, G - 60))
        c.flash(288, 3, 0.45); c.shake(288, 7, 10); c.punch(288, 10, 0.05, (SX, 600))
        c.shake(392, 10, 10); c.punch(392, 12, 0.06, self.wrap_center(392))
        c.shake(510, 4, 4); c.flash(548, 2, 0.25); c.shake(548, 5, 6)

    # ================================================================ малыш
    def baby(self, f):
        key = ('b', f)
        if key not in self._cache:
            self._cache[key] = self._baby(f)
        return self._cache[key]

    def _baby(self, f):
        p = dict(dir=1, face_shift=0.12, eyes='normal', prop=f * 6.0, prop_blur=False)
        x, lift, sx, sy, rot = BX, 0.0, 1.0, 1.0, 0.0
        chew = False
        if f < 96:
            chew = True
            if 60 <= f < 96:
                p['eyes'] = 'angry'
        # выдувает пузырь, пузырь поднимает его и несёт к скелету
        if 96 <= f < 200:
            t_up = ease_io(seg(f, 120, 150))
            t_go = ease_io(seg(f, 150, 186))
            x = lerp(BX, SX, t_go)
            lift = lerp(0, 470, t_up) + 12 * math.sin(f * 0.25) * t_up
            rot = -8 * math.sin(f * 0.2) * t_up
            if f >= 186:
                p['eyes'] = 'normal'
        # пузырь лопнул — падает на скелета
        elif 200 <= f < 214:
            x = SX
            t = ease_in(seg(f, 202, 214))
            lift = lerp(470, self.flat_top(), t)
            p['eyes'] = 'sad'
        elif 214 <= f < 238:
            t = seg(f, 214, 238)
            x = lerp(SX, 1000, ease_out(t))
            lift = (1 - t) * self.flat_top() + 4 * 160 * t * (1 - t)
            rot = -360 * ease_out(t)
            p['eyes'] = 'sad'
        elif 238 <= f < 262:
            x = 1000
            sx, sy = ball_squash(f, 232, 238, 0, 8)
            p['eyes'] = 'sad' if f < 256 else 'angry'
        elif 262 <= f < 296:
            # отступает к себе
            t = ease_io(seg(f, 262, 290))
            x = lerp(1000, BX2, t)
            lift = 160 * math.sin(math.pi * t)
            p['dir'] = -1 if f < 286 else 1
        elif 296 <= f < 330:
            x = BX2
            p['eyes'] = 'normal'
            p['eye_s'] = (1.3, 1.3)
            x += tremble(f, 3)
        elif f >= 330:
            x = BX2
            p['eyes'] = 'angry'
        # жуёт и дует огромный пузырь
        if 330 <= f < 352:
            chew = True
        if 398 <= f < 406:
            p['eyes'] = 'angry'
            sx, sy = (0.9, 1.1) if f < 402 else (1.05, 0.95)      # откусил
        if 404 <= f < 456:
            p['eyes'] = 'normal'
        # к центру и празднует
        if 456 <= f < 490:
            t = ease_io(seg(f, 456, 486))
            x = lerp(BX2, CENTER, t)
            lift = 140 * math.sin(math.pi * t)
            p['prop_blur'] = True
        elif f >= 490:
            x = CENTER
            sx, sy = ball_squash(f, 484, 490, 0, 8)
            if 504 <= f < 532:
                chew = True
            if 548 <= f < 560:
                p['eyes'] = 'sad'
            if f >= 520:
                p['face_shift'] = lerp(0.12, 0.0, seg(f, 520, 524))
            for a in (568, 584):
                if a - 4 <= f < a + 14:
                    _, lift = hop(f, a, a + 10, CENTER, CENTER, 55)
                    sx, sy = ball_squash(f, a, a + 10, 4, 6)
        if chew:
            p['mouth_s'] = (1.0, 0.55 if (f // 4) % 2 else 1.0)
        if lift > 1:
            p['prop'] = f * 40.0
            p['prop_blur'] = True
        p.update(x=x, y=G - lift, sx=sx, sy=sy, rot=rot)
        return p

    def mouth(self, p):
        return self.baby_r.point(p, (0.05, 0.30), face=True)

    def baby_bubble(self, f):
        """Пузырь у рта малыша: (x, y, r) или None."""
        p = self.baby(f)
        m = self.mouth(p)
        d = p['dir']
        r = 0.0
        if 96 <= f < 200:
            r = 160 * ease_out(seg(f, 98, 122)) + 6 * math.sin(f * 0.5) * (f > 122)
            if 186 <= f < 200:
                r *= 1 + 0.15 * seg(f, 186, 200)       # раздувается, пока он хохочет
        elif 352 <= f < 392:
            r = 120 * ease_out(seg(f, 352, 372)) + 160 * ease_in(seg(f, 372, 392))
        elif 532 <= f < 548:
            r = 70 * ease_out(seg(f, 532, 546))
        if r <= 1:
            return None
        return m[0] + d * r * 0.85, m[1] - r * 0.30, r

    # ================================================================ скелет-шарик
    def flat_top(self):
        """Высота над землёй, на которую малыш падает (верх сплющенного скелета)."""
        return 2 * R_BALL * 0.25

    def ball(self, f):
        key = ('s', f)
        if key not in self._cache:
            self._cache[key] = self._sball(f)
        return self._cache[key]

    def _sball(self, f):
        if f >= 290:
            return None
        p = dict(x=SX, dir=-1, face_shift=0.12, eyes='angry', mouth='theeth smile')
        x, lift, sx, sy = SX, 0.0, 1.0, 1.0
        for a in (24, 42):
            if a - 4 <= f < a + 12:
                _, lift = hop(f, a, a + 8, SX, SX, 50)
                sx, sy = ball_squash(f, a, a + 8, 4, 4)
        if 150 <= f < 200:
            p.update(eyes='angry', mouth='puzzlement', eye_dy=-0.05)
            for a in (160, 178):
                if a - 4 <= f < a + 14:
                    _, lift = hop(f, a, a + 10, SX, SX, 70)
                    sx, sy = ball_squash(f, a, a + 10, 4, 4)
        if 200 <= f < 214:
            p.update(eyes='normal', mouth='puzzlement', eye_dy=-0.06, eye_s=(1.3, 1.3))
        if 214 <= f < 236:
            sx, sy = 1.9, 0.25
            p.update(eyes='sad', mouth='puzzlement')
        elif 236 <= f < 246:
            t = f - 236
            sx, sy = ((1.6, 0.45), (1.3, 0.7), (0.9, 1.15), (0.85, 1.2), (1.08, 0.92), (1.04, 0.97),
                      (1.0, 1.0), (1.0, 1.0), (1.0, 1.0), (1.0, 1.0))[t]
            p.update(eyes='sad', mouth='puzzlement')
        elif 246 <= f < 290:
            p.update(eyes='angry', mouth='puzzlement')
            x += tremble(f, 2)
            if f >= 270:
                p['mouth'] = 'theeth smile'
                x += tremble(f, 6, 1)
                p['scale'] = lerp(1.0, 1.1, seg(f, 270, 286))
        p.update(x=x, y=G - lift, sx=sx, sy=sy)
        return p

    # ================================================================ большой скелет
    STAND = dict(x=SX, dir=-1, wings=20.0, hip=(0.0, 0.0), lean=0.0, head=0.0,
                 armF=(0.0, 0.0, 0.0), armN=(0.0, 0.0, 0.0), footF=(0.0, 0.0), footN=(0.0, 0.0),
                 eyes=(1.0, 0.6), mouth=(1.0, 1.0), face_shift=0.035, scale=1.0, y=G)

    def big(self, f):
        key = ('k', f)
        if key not in self._cache:
            self._cache[key] = self._big(f)
        return self._cache[key]

    def at_center(self, p, cx, cy):
        p['x'] = cx
        p['y'] = cy + self.half * p.get('scale', 1.0)
        return p

    def skel_hit_center(self):
        """Центр тела скелета в момент, когда он влетает в пузырь (кадр 391)."""
        def calc():
            p = self.big(391)
            return p['x'], p['y'] - self.half * p.get('scale', 1.0)
        return self._memo('hitc', calc)

    def _memo(self, key, fn):
        if key not in self._cache:
            self._cache[key] = fn()
        return self._cache[key]

    def wrap_center(self, f):
        """Центр пузыря со скелетом: смыкается вокруг него, отплывает вправо, потом в небо."""
        b = self.baby_bubble(391)
        sc = self.skel_hit_center()
        home = (1130, 560)
        if f < 398:
            t = ease_out(seg(f, 392, 398))
            return lerp(b[0], sc[0], t), lerp(b[1], sc[1], t)
        if f < 406:
            t = ease_io(seg(f, 398, 406))
            return lerp(sc[0], home[0], t), lerp(sc[1], home[1], t)
        t = seg(f, 406, 462)
        return (lerp(home[0], 1760, ease_in(t)) + 30 * math.sin(f * 0.2), lerp(home[1], -260, ease_in(t)))

    def wrap_r(self, f):
        if f < 392:
            return 0
        r0 = self.baby_bubble(391)[2]
        return lerp(r0, 360, ease_out(seg(f, 392, 398))) * lerp(1.0, 0.5, ease_in(seg(f, 406, 462)))

    def _big(self, f):
        if f < 288 or f >= 462:
            return None
        keys = [
            (288, dict(self.STAND, scale=0.55), 'lin'),
            (292, dict(scale=1.1)), (295, dict(scale=0.96)), (298, dict(scale=1.0)),
            (344, {}),
            (354, dict(hip=(0.0, 0.12), lean=12.0, head=-6.0, wings=45.0,
                       armF=(-30.0, 25.0, 0.0), armN=(-35.0, 25.0, 0.0), eyes=(1.0, 0.5))),
        ]
        p = pose_keys(f, keys)
        if 354 <= f < 360:
            p['x'] = SX + tremble(f, 3)
        if 360 <= f < 392:
            # летит низко, руки вперёд — прямо в растущий пузырь
            t = seg(f, 360, 392)
            cx = lerp(SX, 1060, ease_in(t))
            cy = G - self.half - 60 * math.sin(math.pi * min(1, t * 1.4))
            p.update(hip=(0.0, 0.0), lean=18.0, head=-8.0, wings=15 + 35 * math.sin(2 * math.pi * (f - 360) / 6),
                     armF=(80.0, 10.0, 0.0), armN=(70.0, 10.0, 0.0), footF=(-0.04, -0.03), footN=(-0.07, -0.02))
            self.at_center(p, cx, cy)
        elif f >= 392:
            # внутри пузыря: свернулся, колотит по стенкам
            c = self.wrap_center(f)
            sc = self.skel_hit_center()
            if f < 398:
                t = ease_out(seg(f, 392, 398))
                c = (lerp(sc[0], c[0], t * 0.3), lerp(sc[1], c[1], t * 0.3))
            s = lerp(1.0, 0.66, ease_out(seg(f, 392, 400))) * lerp(1.0, 0.5, ease_in(seg(f, 406, 462)))
            bang = math.sin(2 * math.pi * (f - 400) / 10) if f >= 404 else 0.0
            p.update(scale=s, rot=-20 + 10 * math.sin(f * 0.15), wings=-80.0, hip=(0.0, 0.0),
                     armF=(130.0 + 25 * bang, 30.0, 0.0), armN=(-120.0 - 25 * bang, -30.0, 0.0),
                     footF=(0.05, -0.20), footN=(0.02, -0.18), eyes=(1.3, 1.3) if f < 404 else (1.0, 0.55),
                     lean=0.0, head=0.0)
            self.at_center(p, c[0], c[1])
        return p

    # ================================================================ кадр
    def draw(self, ctx, f):
        ctx.save()
        self.cam.apply(ctx, f)
        ctx.set_source_surface(self.bg, -bg.M, -bg.M)
        ctx.paint()
        self.clouds.draw(ctx, f)

        baby, ball, big = self.baby(f), self.ball(f), self.big(f)
        green = (0.1, 0.35, 0.05)
        fx.shadow(ctx, baby['x'], G + 4, 240, G - baby['y'], green)
        if ball:
            fx.shadow(ctx, ball['x'], G + 4, 250 * ball['sx'] * ball.get('scale', 1.0), G - ball['y'], green)
        if big and f < 360:
            fx.shadow(ctx, big['x'], G + 6, 300 * big['scale'], 0, green)
        elif big and f < 392:
            fx.shadow(ctx, big['x'] - 100, G + 6, 400, 90, green)

        if 270 <= f < 290:
            fx.rays(ctx, SX, G - 160, f, r=230 + 60 * seg(f, 270, 286), alpha=seg(f, 270, 274))

        if ball:
            self.sb_r.draw(ctx, ball)
        if big and f < 392:
            self.sk.draw(ctx, big)
        self.baby_r.draw(ctx, baby)
        b = self.baby_bubble(f)
        if b:
            bubble(ctx, *b)
        # лопнувший пузырь на лице малыша, потом он его отдирает
        c = self.baby_r.point(baby, (0.10, 0.12), face=True)
        if 200 <= f < 260:
            r = 115 * (1 - ease_io(seg(f, 240, 258)))
            gum_splat(ctx, c[0] + 40 * seg(f, 240, 258), c[1], r, seed=1)
        if 548 <= f < 566:
            r = 70 * (1 - ease_io(seg(f, 558, 566)))
            gum_splat(ctx, c[0] + 30, c[1], r, seed=2)
        if big and f >= 392:
            self.sk.draw(ctx, big)
        if f >= 392 and big:
            wc = self.wrap_center(f)
            wr = self.wrap_r(f)
            wob = 1 + 0.05 * math.sin(f * 0.6)
            bubble(ctx, wc[0], wc[1], wr, alpha=0.35, sx=wob, sy=2 - wob)
            # жвачная ниточка к малышу, пока не откусил
            if f < 402:
                m = self.mouth(baby)
                ctx.move_to(*m)
                ctx.line_to(wc[0] - wr * 0.9, wc[1] + wr * 0.3)
                ctx.set_source_rgba(*GUM, 1)
                ctx.set_line_width(max(0.5, 14 * (1 - seg(f, 398, 402))))
                ctx.stroke()
        self.effects(ctx, f, baby, ball, big)
        ctx.restore()
        fx.flash(ctx, self.cam.flash_alpha(f))

    def effects(self, ctx, f, baby, ball, big):
        fx.dust(ctx, SX, G, f - 32, n=4, spread=60, size=0.5, seed=1)
        fx.dust(ctx, SX, G, f - 50, n=4, spread=60, size=0.5, seed=2)
        if ball and 150 <= f < 200:
            fx.anger(ctx, SX - 100, G - 270 - (G - ball['y']), f, 1.2)
        # пузырь лопнул
        if 200 <= f < 210:
            m = self.mouth(self.baby(200))
            fx.spark(ctx, m[0] + 120, m[1], f - 200, 0.9)
        fx.dust(ctx, SX, G, f - 214, n=8, spread=220, size=1.1, seed=3)
        if ball and 218 <= f < 246:
            fx.dizzy(ctx, SX, G - 120, f - 218, rx=110)
        fx.dust(ctx, 1150, G, f - 238, n=5, spread=110, size=0.7, seed=4)
        if ball and 250 <= f < 288:
            fx.anger(ctx, ball['x'] - 95, G - 270, f, 1.2)
            fx.steam(ctx, ball['x'], G - 300, f - 250, 1.1)
        fx.smoke(ctx, SX, 640, f - 288, size=1.5, seed=5)
        if 298 <= f < 330:
            bc = (baby['x'], baby['y'] - R_BALL)
            fx.sweat(ctx, bc[0] + 130, bc[1] - 120, f - 298, 1.1)
        fx.dust(ctx, SX, G, f - 360, n=6, spread=170, seed=6)
        # скелет в пузыре: злится
        if big and 410 <= f < 462:
            head = self.sk.joint(big, 'head', (0.115, -0.86))
            fx.anger(ctx, head[0] + 30, head[1] + 20, f, 0.9)
        fx.twinkle(ctx, 1620, 60, f - 458, 1.4, dur=22)
        fx.dust(ctx, CENTER, G, f - 490, n=5, spread=110, size=0.7, seed=7)
        if 548 <= f < 556:
            c = self.baby_r.point(baby, (0.10, 0.12), face=True)
            fx.spark(ctx, c[0] + 40, c[1], f - 548, 0.5, dur=6)
        if f >= 560:
            for i, (dx, dy, ph) in enumerate(((-330, -460, 0), (300, -520, 7), (-420, -220, 13),
                                               (380, -300, 4), (-200, -600, 10), (220, -120, 16))):
                fx.twinkle(ctx, CENTER + dx, G + dy, (f - 560 + ph * 2) % 26, 0.9, dur=22)
