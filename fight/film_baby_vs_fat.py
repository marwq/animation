"""Малыш против Толстого: коробка-сюрприз. Луг с радугой и сакурой, день. 25 с = 600 кадров.

 0–4 с      стойка по краям, смотрят друг на друга: малыш подпрыгивает,
            пропеллер лениво крутится; толстый хлопает себя по животу
 4–7 с      малыш взлетает над толстым и камнем падает ему на макушку —
            толстого сплющивает, звёздочки; малыш отскакивает
 7–11 с     толстый злится, прыжками к малышу, приседает и прыгает сверху —
            малыш в последний миг взмывает, толстый плюхается на пустое место
 11–15 с    малыш улетает за кадр и приносит коробку с бантом, ставит её
            перед толстым и отлетает
 15–18 с    толстый радуется подарку, подходит, с любопытством наклоняется —
            крышка отлетает, перчатка на пружине бьёт его в лицо, он улетает за кадр
 18–25 с    малыш хохочет, выходит в центр и празднует
"""
import math
import random

import cairo

import bg
import fx
from anim import Camera, ball_squash, hop, lerp, seg
from fx import ease_in, ease_io, ease_out
from rig import GROUND_Y as G, Ball

BX0, BX1, BX2 = 440, 600, 1500  # малыш: стойка, после отскока, после побега
FX0, FX1, FX2 = 1450, 600, 740  # толстый: стойка, после промаха, у коробки
BOX = (1090, 130, 116)          # коробка: центр x, ширина, высота
CENTER = 840
DROP, MISS, BOING = 140, 258, 424
R = 150
OUT = (0.08, 0.05, 0.05)


def tremble(f, amp, seed=0):
    return random.Random(f * 31 + seed).uniform(-amp, amp)


def bezier(t, p0, p1, p2):
    u = 1 - t
    return (u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0],
            u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1])


def gift(ctx, x, bottom, w, h, lid=True, shake=0.0):
    """Коробка с лентой крест-накрест; lid — крышка с бантом на месте."""
    ctx.save()
    ctx.translate(x + shake, bottom)
    ctx.rectangle(-w / 2, -h, w, h)
    ctx.set_source_rgb(0.20, 0.72, 0.86)
    ctx.fill_preserve()
    ctx.set_source_rgb(*OUT)
    ctx.set_line_width(4)
    ctx.stroke()
    ctx.rectangle(-12, -h, 24, h)
    ctx.set_source_rgb(1.0, 0.42, 0.70)
    ctx.fill_preserve()
    ctx.set_source_rgb(*OUT)
    ctx.set_line_width(3)
    ctx.stroke()
    if lid:
        draw_lid(ctx, 0, -h, 0.0, w)
    ctx.restore()


def draw_lid(ctx, x, y, rot, w):
    """Крышка с бантом; (x, y) — середина нижнего края крышки."""
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(rot)
    ctx.rectangle(-w / 2 - 8, -26, w + 16, 26)
    ctx.set_source_rgb(0.25, 0.80, 0.93)
    ctx.fill_preserve()
    ctx.set_source_rgb(*OUT)
    ctx.set_line_width(4)
    ctx.stroke()
    ctx.rectangle(-12, -26, 24, 26)
    ctx.set_source_rgb(1.0, 0.42, 0.70)
    ctx.fill_preserve()
    ctx.set_source_rgb(*OUT)
    ctx.set_line_width(3)
    ctx.stroke()
    for side in (-1, 1):
        ctx.save()
        ctx.translate(side * 20, -40)
        ctx.rotate(side * 0.5)
        ctx.scale(24, 14)
        ctx.arc(0, 0, 1, 0, 2 * math.pi)
        ctx.restore()
        ctx.set_source_rgb(1.0, 0.42, 0.70)
        ctx.fill_preserve()
        ctx.set_source_rgb(*OUT)
        ctx.set_line_width(3)
        ctx.stroke()
    ctx.arc(0, -32, 9, 0, 2 * math.pi)
    ctx.set_source_rgb(0.95, 0.30, 0.60)
    ctx.fill_preserve()
    ctx.set_source_rgb(*OUT)
    ctx.stroke()
    ctx.restore()


def spring_glove(ctx, base, tip, coils=7):
    """Пружина от base до tip и боксёрская перчатка на конце, смотрит вдоль пружины."""
    dx, dy = tip[0] - base[0], tip[1] - base[1]
    ln = math.hypot(dx, dy) or 1.0
    ux, uy = dx / ln, dy / ln
    nx, ny = -uy, ux
    end = (tip[0] - ux * 40, tip[1] - uy * 40)
    sl = math.hypot(end[0] - base[0], end[1] - base[1])
    ctx.move_to(*base)
    n = coils * 2
    for i in range(1, n + 1):
        t = i / (n + 1)
        a = 18 * (1 if i % 2 else -1)
        ctx.line_to(base[0] + ux * sl * t + nx * a, base[1] + uy * sl * t + ny * a)
    ctx.line_to(*end)
    ctx.set_line_join(cairo.LINE_JOIN_ROUND)
    ctx.set_source_rgb(*OUT)
    ctx.set_line_width(9)
    ctx.stroke_preserve()
    ctx.set_source_rgb(0.75, 0.77, 0.80)
    ctx.set_line_width(4)
    ctx.stroke()
    ang = math.atan2(uy, ux)
    ctx.save()
    ctx.translate(*tip)
    ctx.rotate(ang)
    # манжета
    ctx.rectangle(-58, -22, 22, 44)
    ctx.set_source_rgb(1, 1, 1)
    ctx.fill_preserve()
    ctx.set_source_rgb(*OUT)
    ctx.set_line_width(4)
    ctx.stroke()
    # кулак
    ctx.save()
    ctx.translate(-6, 0)
    ctx.scale(44, 38)
    ctx.arc(0, 0, 1, 0, 2 * math.pi)
    ctx.restore()
    ctx.set_source_rgb(0.90, 0.13, 0.15)
    ctx.fill_preserve()
    ctx.set_source_rgb(*OUT)
    ctx.stroke()
    # большой палец
    ctx.save()
    ctx.translate(-12, -30)
    ctx.rotate(-0.3)
    ctx.scale(20, 12)
    ctx.arc(0, 0, 1, 0, 2 * math.pi)
    ctx.restore()
    ctx.set_source_rgb(0.90, 0.13, 0.15)
    ctx.fill_preserve()
    ctx.set_source_rgb(*OUT)
    ctx.stroke()
    ctx.save()
    ctx.translate(4, 14)
    ctx.scale(18, 9)
    ctx.arc(0, 0, 1, 0, 2 * math.pi)
    ctx.restore()
    ctx.set_source_rgba(1, 1, 1, 0.6)
    ctx.fill()
    ctx.restore()


class Film:
    frames = 600

    def __init__(self):
        self.bg = bg.meadow('rainbow', seed=81)
        self.clouds = bg.Clouds(seed=77)
        self.baby_r = Ball('child')
        self.fat_r = Ball('fat')
        self._cache = {}
        c = self.cam = Camera()
        c.shake(22, 3, 3); c.shake(42, 3, 3)
        c.shake(DROP, 12, 14); c.punch(DROP, 12, 0.07, (FX0, G - 300))
        c.shake(162, 5, 5)
        c.shake(MISS, 18, 22); c.punch(MISS, 14, 0.08, (FX1, G - 100)); c.flash(MISS, 3, 0.25)
        c.shake(356, 4, 4)
        c.flash(BOING + 2, 3, 0.4); c.shake(BOING + 2, 14, 18); c.punch(BOING + 2, 12, 0.09, self.face_pt())

    def _memo(self, key, fn):
        if key not in self._cache:
            self._cache[key] = fn()
        return self._cache[key]

    # ================================================================ малыш
    def baby(self, f):
        key = ('b', f)
        if key not in self._cache:
            self._cache[key] = self._baby(f)
        return self._cache[key]

    def fat_top(self, f):
        p = self.fat(f)
        return G - (G - p['y']) - self.fat_r.h * self.fat_r.k * p['sy']

    def _baby(self, f):
        p = dict(dir=1, face_shift=0.12, eyes='normal')
        x, lift, sx, sy, rot = BX0, 0.0, 1.0, 1.0, 0.0
        for a in (20, 40):
            if a - 3 <= f < a + 12:
                _, lift = hop(f, a, a + 8, BX0, BX0, 40)
                sx, sy = ball_squash(f, a, a + 8, 3, 4)
        if f >= 60:
            p['eyes'] = 'angry'
        # над толстым и вниз камнем
        if 96 <= f < 132:
            t = seg(f, 96, 128)
            x, lift = bezier(ease_io(t), (BX0, 0), (900, 640), (FX0, 520))
            lift += 6 * math.sin(f * 0.9) * (f > 100)
        elif 132 <= f < DROP:
            x = FX0
            lift = lerp(520, G - self.fat_top(DROP - 1), ease_in(seg(f, 132, DROP)))
            sx, sy = 0.88, 1.12
        elif DROP <= f < 164:
            t = seg(f, DROP, 162)
            top = G - self.fat_top(DROP - 1)
            x = lerp(FX0, BX1, ease_out(t))
            lift = (1 - t) * top + 4 * 260 * t * (1 - t)
            rot = -360 * ease_out(t)
            if f < DROP + 2:
                sx, sy = 1.25, 0.8
        elif 164 <= f < 236:
            x = BX1
            sx, sy = ball_squash(f, 158, 162, 0, 8) if f < 172 else (1.0, 1.0)
            if 172 <= f < 200:
                sx, sy = (1.05, 0.95) if ((f - 172) // 4) % 2 == 0 else (0.97, 1.03)
        # толстый прыгает сверху — малыш взмывает и перелетает вправо
        elif 236 <= f < 244:
            x = BX1
            p['eye_s'] = (1.3, 1.3)
            sx, sy = (1.12, 0.88) if f >= 240 else (1.0, 1.0)
        elif 244 <= f < 272:
            # проскакивает низом под летящим толстым и улетает вправо
            if f < 254:
                t = ease_out(seg(f, 244, 254))
                x, lift = lerp(BX1, 1120, t), 25 * math.sin(math.pi * t)
                sx, sy = 1.12, 0.9
            else:
                t = seg(f, 254, 270)
                x, lift = bezier(ease_io(t), (1120, 0), (1320, 260), (BX2, 0))
                if f >= 270:
                    lift = 0
        elif 272 <= f < 292:
            x = BX2
            sx, sy = ball_squash(f, 266, 270, 0, 8) if f < 280 else ((1.05, 0.95) if ((f - 280) // 4) % 2 == 0 else (0.97, 1.03))
        # за подарком и обратно
        elif 292 <= f < 318:
            t = ease_in(seg(f, 292, 312))
            x, lift = lerp(BX2, 2150, t), lerp(0, 380, ease_out(seg(f, 292, 302)))
        elif 318 <= f < 346:
            t = ease_out(seg(f, 318, 346))
            x, lift = lerp(2150, BOX[0], t), 380
            p['dir'] = -1
        elif 346 <= f < 358:
            t = ease_io(seg(f, 346, 356))
            x, lift = BOX[0], lerp(380, BOX[2] + 60, t)
            p['dir'] = -1
        elif 358 <= f < 380:
            t = seg(f, 358, 378)
            x, lift = bezier(ease_io(t), (BOX[0], BOX[2] + 60), (1300, 420), (BX2, 0))
            if f >= 378:
                lift = 0
            p['dir'] = -1
        elif f >= 380:
            x = BX2
            p['dir'] = -1
            p['eyes'] = 'angry'
            if f < 388:
                sx, sy = ball_squash(f, 374, 378, 0, 8)
            # хохочет
            if BOING + 4 <= f < 462:
                p['eyes'] = 'normal'
                sx, sy = (1.06, 0.94) if ((f - BOING) // 4) % 2 == 0 else (0.96, 1.04)
            # в центр
            if 466 <= f < 500:
                t = seg(f, 466, 498)
                x, lift = bezier(ease_io(t), (BX2, 0), (1150, 520), (CENTER, 0))
                if f >= 498:
                    lift = 0
            elif f >= 500:
                x = CENTER
                sx, sy = ball_squash(f, 494, 498, 0, 8) if f < 506 else (1.0, 1.0)
                if f >= 516:
                    p['face_shift'] = lerp(0.12, 0.0, seg(f, 516, 520))
                p['eyes'] = 'normal'
                for a in (540, 566):
                    if a - 4 <= f < a + 14:
                        _, lift = hop(f, a, a + 10, CENTER, CENTER, 60)
                        sx, sy = ball_squash(f, a, a + 10, 4, 6)
        flying = lift > 2
        p['prop'] = f * (40.0 if flying else 7.0)
        p['prop_blur'] = flying
        p.update(x=x, y=G - lift, sx=sx, sy=sy, rot=rot)
        return p

    # ================================================================ толстый
    def fat(self, f):
        key = ('fat', f)
        if key not in self._cache:
            self._cache[key] = self._fat(f)
        return self._cache[key]

    def _fat(self, f):
        if f >= BOING + 24:
            return None
        p = dict(dir=-1, face_shift=0.12, eyes='normal', mouth='theeth smile')
        x, lift, sx, sy, rot = FX0, 0.0, 1.0, 1.0, 0.0
        if 44 <= f < 70:
            t = f - 44
            k = 0.06 * math.sin(2 * math.pi * t / 8) * (1 - t / 26)
            sx, sy = 1 + k, 1 - k
            p['mouth'] = 'happy'
        if f >= 70:
            p['eyes'] = 'angry'
        if 120 <= f < DROP:
            p.update(eyes='normal', mouth='puzzlement', eye_dy=-0.05)
        # малыш упал на голову
        if DROP <= f < 158:
            t = seg(f, DROP, 158)
            if f < DROP + 6:
                sx, sy = 1.35, 0.62
            else:
                u = seg(f, DROP + 6, 158)
                sx, sy = lerp(0.9, 1.0, u), lerp(1.12, 1.0, u)
            p.update(eyes='sad', mouth='puzzlement')
        elif 158 <= f < 178:
            p.update(eyes='sad', mouth='puzzlement')
        elif 178 <= f < 200:
            p.update(eyes='angry', mouth='theeth smile')
            x += tremble(f, 3)
        # прыжками к малышу, присед, прыжок сверху — промах
        if 200 <= f < 226:
            if f < 214:
                x, lift = hop(f, 202, 212, FX0, 1260, 70)
                sx, sy = ball_squash(f, 202, 212, 2, 2)
            else:
                x, lift = hop(f, 214, 224, 1260, 1080, 70)
                sx, sy = ball_squash(f, 214, 224, 2, 2)
            p.update(eyes='angry', mouth='theeth smile')
        elif 226 <= f < 236:
            x = 1080 + tremble(f, 3) * (f >= 230)
            t = ease_out(seg(f, 226, 230))
            sx, sy = lerp(1.0, 1.22, t), lerp(1.0, 0.78, t)
            p.update(eyes='angry', mouth='theeth smile')
        elif 236 <= f < MISS:
            x = lerp(1080, FX1, ease_io(seg(f, 236, 250)))
            if f < 248:
                lift = 380 * ease_out(seg(f, 236, 248))
            elif f < 252:
                lift = 380
            else:
                lift = lerp(380, 0, ease_in(seg(f, 252, MISS)))
            if f < 239:
                sx, sy = 0.84, 1.18
            p.update(eyes='angry' if f < 248 else 'normal', mouth='theeth smile' if f < 248 else 'puzzlement',
                     eye_s=(1.0, 1.0) if f < 248 else (1.3, 1.3))
        elif MISS <= f < 290:
            x = FX1
            if f < MISS + 3:
                sx, sy = 1.4, 0.6
            elif f < MISS + 12:
                u = seg(f, MISS + 3, MISS + 12)
                sx, sy = lerp(1.4, 1.0, ease_out(u)), lerp(0.6, 1.0, ease_out(u))
            p.update(eyes='sad', mouth='puzzlement')
            if f >= 272:
                p.update(eyes='angry', mouth='theeth smile')
                x += tremble(f, 2)
        elif f >= 290:
            x = FX1
            p.update(eyes='angry', mouth='smile normal')
        # разворот к малышу (он теперь справа)
        if f >= 288:
            p['dir'] = -1 if f < 289 else 1
            if f < 291:
                sx *= (0.55, 0.3, 0.7)[f - 288]
        # подарок!
        if 356 <= f < BOING:
            p.update(eyes='normal', mouth='happy', eye_s=(1.2, 1.2))
        if 372 <= f < 386:
            x, lift = hop(f, 374, 384, FX1, FX2, 60)
            sx, sy = ball_squash(f, 374, 384, 2, 2)
        elif 386 <= f < BOING:
            x = FX2
            # наклоняется с любопытством
            t = ease_io(seg(f, 396, 414))
            p['face_shift'] = lerp(0.12, 0.22, t)
            p['eye_dy'] = 0.02 * t
            sx = sx * lerp(1.0, 1.06, t)
            x += 18 * t
            p['mouth'] = 'puzzlement' if f >= 404 else 'happy'
        # БОИНГ — улетает влево за кадр
        if f >= BOING:
            t = seg(f, BOING + 2, BOING + 24)
            x = FX2 + 18 - 1250 * ease_out(t)
            lift = 360 * math.sin(math.pi * t * 0.8)
            rot = -540 * t
            p.update(eyes='sad', mouth='puzzlement', face_shift=0.22)
            if f < BOING + 4:
                sx, sy = 1.15, 0.9
        p.update(x=x, y=G - lift, sx=sx, sy=sy, rot=rot)
        return p

    def face_pt(self):
        """Лицо толстого в момент удара перчаткой."""
        return self._memo('face', lambda: self.fat_r.point(self.fat(BOING + 1), (0.12, 0.17), face=True))

    # ================================================================ коробка
    def glove(self, f):
        """(база пружины, конец) или None."""
        if f < BOING:
            return None
        base = (BOX[0], G - BOX[2] - 4)
        face = self.face_pt()
        hit = (face[0] + 30, face[1])
        if f < BOING + 2:
            t = ease_out(seg(f, BOING, BOING + 2))
            tip = (lerp(base[0], hit[0], t), lerp(base[1] - 40, hit[1], t))
        elif f < BOING + 8:
            tip = hit
        else:
            # пружина сжимается и болтается над коробкой
            t = f - (BOING + 8)
            rest = (base[0] - 40, base[1] - 170)
            k = math.exp(-t / 14) * math.cos(t / 2.2)
            tip = (rest[0] + (hit[0] - rest[0]) * k, rest[1] + (hit[1] - rest[1]) * k)
        return base, tip

    # ================================================================ кадр
    def draw(self, ctx, f):
        ctx.save()
        self.cam.apply(ctx, f)
        ctx.set_source_surface(self.bg, -bg.M, -bg.M)
        ctx.paint()
        self.clouds.draw(ctx, f)

        baby, fat = self.baby(f), self.fat(f)
        green = (0.1, 0.35, 0.05)
        fx.shadow(ctx, baby['x'], G + 4, 240, G - baby['y'], green)
        if fat:
            fx.shadow(ctx, fat['x'], G + 4, 470 * abs(fat['sx']), G - fat['y'], green)
        if f >= 356:
            fx.shadow(ctx, BOX[0], G + 4, 180, 0, green)

        # коробка
        carried = 318 <= f < 356
        if f >= 318:
            if carried:
                bx = baby['x']
                bottom = baby['y'] + BOX[2] + 40      # коробка висит под малышом на ленточке
                # ленточка от малыша к банту
                ctx.move_to(bx, baby['y'] - 4)
                ctx.line_to(bx, bottom - BOX[2] - 40)
                ctx.set_source_rgb(1.0, 0.42, 0.70)
                ctx.set_line_width(5)
                ctx.stroke()
                gift(ctx, bx, bottom, BOX[1], BOX[2], lid=True)
            else:
                shake = 4 * math.sin(f * 2.1) if 398 <= f < BOING else 0.0
                gift(ctx, BOX[0], G, BOX[1], BOX[2], lid=f < BOING, shake=shake)
        if fat:
            self.fat_r.draw(ctx, fat)
        if f >= BOING:
            # крышка отлетает и падает за коробкой
            t = seg(f, BOING, BOING + 26)
            lx, ly = bezier(t, (BOX[0], G - BOX[2]), (BOX[0] + 120, G - 520), (BOX[0] + 230, G))
            draw_lid(ctx, lx, ly, 2 * math.pi * ease_out(t), BOX[1])
            gl = self.glove(f)
            spring_glove(ctx, *gl)
        self.baby_r.draw(ctx, baby)
        self.effects(ctx, f, baby, fat)
        ctx.restore()
        fx.flash(ctx, self.cam.flash_alpha(f))

    def effects(self, ctx, f, baby, fat):
        fx.dust(ctx, BX0, G, f - 28, n=4, spread=60, size=0.5, seed=1)
        fx.dust(ctx, BX0, G, f - 48, n=4, spread=60, size=0.5, seed=2)
        fx.dust(ctx, BX0, G, f - 98, n=6, spread=120, size=0.8, seed=3)
        top = self.fat_top(DROP)
        fx.spark(ctx, FX0, top, f - DROP, 1.0)
        if fat and DROP + 4 <= f < 178:
            fx.dizzy(ctx, fat['x'], self.fat_top(f) - 40, f - DROP, rx=110)
        fx.dust(ctx, BX1, G, f - 162, n=5, spread=110, size=0.7, seed=4)
        if fat and 178 <= f < 200:
            fx.anger(ctx, fat['x'] - 150, G - 400, f, 1.3)
            fx.steam(ctx, fat['x'], G - 470, f - 178, 1.2)
        fx.dust(ctx, 1260, G, f - 212, n=4, spread=90, size=0.7, seed=5)
        fx.dust(ctx, 1080, G, f - 224, n=4, spread=90, size=0.7, seed=6)
        if 236 <= f < 246:
            fx.sweat(ctx, BX1 + 140, G - 280, f - 236, 1.1)
        fx.whoosh(ctx, BX1 + 60, G - 150, f - 248, 1.3, trail=-1)
        fx.dust(ctx, FX1, G, f - MISS, n=10, spread=360, size=1.3, seed=7)
        if fat and MISS + 4 <= f < 280:
            fx.dizzy(ctx, fat['x'], G - 500, f - MISS, rx=110)
        fx.dust(ctx, BX2, G, f - 270, n=5, spread=110, size=0.7, seed=8)
        fx.dust(ctx, BOX[0], G, f - 356, n=5, spread=130, size=0.7, seed=9)
        fx.dust(ctx, FX2, G, f - 384, n=4, spread=90, size=0.7, seed=10)
        # подарок: восторг
        if fat and 358 <= f < 396:
            fx.hearts_up(ctx, fat['x'], G - 500, f, 3, 1.0)
        if fat and 404 <= f < BOING:
            fx.sweat(ctx, fat['x'] - 160, G - 420, f - 404, 1.1, side=-1)
        # БОИНГ
        fx.spark(ctx, *self.face_pt(), f - (BOING + 2), 1.2)
        fx.twinkle(ctx, 50, 380, f - (BOING + 20), 1.4, dur=22)
        fx.dust(ctx, CENTER, G, f - 498, n=5, spread=110, size=0.7, seed=11)
        if f >= 530:
            for i, (dx, dy, ph) in enumerate(((-330, -460, 0), (300, -520, 7), (-420, -220, 13),
                                               (380, -300, 4), (-200, -600, 10), (220, -120, 16))):
                fx.twinkle(ctx, CENTER + dx, G + dy, (f - 530 + ph * 2) % 26, 0.9, dur=22)
