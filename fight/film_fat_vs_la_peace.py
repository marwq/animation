"""Толстый против Ла Писа: яблоня. Ферма, день. 25 с = 600 кадров.

 0–4 с      стойка по краям, между ними яблоня: толстый облизывается на яблоки,
            Ла Пис самодовольно гладит бороду
 4–7 с      толстый прыжками к дереву, толкает ствол животом — яблоко падает ему
            на голову и отскакивает прямо в рот; жуёт
 7–12 с     Ла Пис шлёпает по стволу — золотое яблоко бьёт его по макушке
            и отскакивает через дерево прямо в рот толстому; толстый хохочет
 12–15.5 с  Ла Пис злится, замахивается обеими руками и бьёт по стволу —
            град яблок на жадного толстого, звёздочки
 15.5–17 с  толстый злится, огромным ртом засасывает все яблоки с земли и раздувается
 17–19.5 с  присел, задрожал — и тремя яблоками, как из пушки: в лоб, в живот,
            и последнее уносит Ла Писа за кадр
 19.5–25 с  толстый сдувается, прыжками выходит в центр и радуется
"""
import math
import random

import bg
import fx
from anim import Camera, ball_squash, hop, lerp, pose_keys, seg
from fx import ease_in, ease_io, ease_out
from rig import GROUND_Y as G, LA_PEACE, Ball, Big

FX0, FX = 430, 650              # толстый: стойка, у дерева
LP0, LPX = 1490, 1150           # Ла Пис: стойка, у дерева
HOV = 14
CENTER = 960
TREE = (960, G)                 # основание ствола
TRUNK_W, TRUNK_H = 64, 300
CANOPY = (960, 420, 270)        # центр и радиус кроны
REST = (0.0, 0.0, 0.0)
TIP_LP = (0.252, 0.50)
BEARD_LP = (0.10, -0.05)
RED, GOLD = (0.88, 0.12, 0.12), (1.0, 0.80, 0.12)

# яблоки на кроне: (x, y) в покое
ON_TREE = [(760, 380), (1130, 370), (840, 270), (1000, 230), (1080, 470), (900, 460),
           (800, 520), (1180, 530), (960, 340), (720, 450), (1050, 300), (880, 360)]
APPLE_A, GOLDEN = 0, 1
HAIL = [9, 2, 6, 11, 5, 3]      # падают на толстого
SHOTS = [(426, 434, 'head'), (438, 446, 'belly'), (450, 458, 'face')]


def tremble(f, amp, seed=0):
    return random.Random(f * 31 + seed).uniform(-amp, amp)


def bezier(t, p0, p1, p2):
    u = 1 - t
    return (u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0],
            u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1])


def draw_apple(ctx, x, y, r, color=RED, rot=0.0, alpha=1.0):
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(rot)
    ctx.move_to(0, -r * 0.62)
    ctx.curve_to(r * 0.55, -r * 1.12, r * 1.1, -r * 0.6, r, 0.05 * r)
    ctx.curve_to(r * 0.95, r * 0.8, r * 0.35, r * 1.05, 0, r * 0.88)
    ctx.curve_to(-r * 0.35, r * 1.05, -r * 0.95, r * 0.8, -r, 0.05 * r)
    ctx.curve_to(-r * 1.1, -r * 0.6, -r * 0.55, -r * 1.12, 0, -r * 0.62)
    ctx.close_path()
    ctx.set_source_rgba(*color, alpha)
    ctx.fill_preserve()
    ctx.set_source_rgba(0.08, 0.05, 0.05, alpha)
    ctx.set_line_width(max(2.5, r * 0.12))
    ctx.stroke()
    ctx.move_to(0, -r * 0.6)
    ctx.line_to(r * 0.08, -r * 1.05)
    ctx.set_line_width(max(2.5, r * 0.12))
    ctx.stroke()
    ctx.save()
    ctx.translate(r * 0.38, -r * 0.92)
    ctx.rotate(-0.5)
    ctx.scale(r * 0.36, r * 0.16)
    ctx.arc(0, 0, 1, 0, 2 * math.pi)
    ctx.restore()
    ctx.set_source_rgba(0.30, 0.68, 0.18, alpha)
    ctx.fill_preserve()
    ctx.set_source_rgba(0.08, 0.05, 0.05, alpha)
    ctx.set_line_width(2)
    ctx.stroke()
    ctx.save()
    ctx.translate(-r * 0.45, -r * 0.2)
    ctx.scale(r * 0.16, r * 0.28)
    ctx.arc(0, 0, 1, 0, 2 * math.pi)
    ctx.restore()
    ctx.set_source_rgba(1, 1, 1, 0.75 * alpha)
    ctx.fill()
    ctx.restore()


class Film:
    frames = 600

    def __init__(self):
        self.bg = bg.meadow('farm', seed=41)
        self.clouds = bg.Clouds(seed=33)
        self.fat_r = Ball('fat')
        self.lp = Big(LA_PEACE)
        self._cache = {}
        rng = random.Random(9)
        # где оседают яблоки града на земле (их потом засасывает рот)
        self.rest = {}
        for k, i in enumerate(HAIL):
            side = -1 if k % 2 == 0 else 1
            self.rest[i] = (FX + side * rng.uniform(300, 420), G - 22)
        c = self.cam = Camera()
        c.shake(110, 4, 4); c.shake(124, 4, 4)
        c.shake(128, 6, 6)
        c.shake(144, 5, 5)
        c.shake(196, 6, 6)
        c.shake(210, 5, 5)
        c.flash(312, 3, 0.35); c.shake(312, 16, 14); c.punch(312, 10, 0.05, (TREE[0] + 40, G - 280))
        c.shake(434, 6, 8); c.shake(446, 6, 8)
        c.flash(458, 4, 0.4); c.shake(458, 14, 20); c.punch(458, 12, 0.09, self.shot_target('face'))
        c.shake(504, 5, 5); c.shake(518, 5, 6); c.shake(560, 4, 5); c.shake(582, 4, 5)

    def _memo(self, key, fn):
        if key not in self._cache:
            self._cache[key] = fn()
        return self._cache[key]

    # ================================================================ дерево
    def shake(self, f):
        """Наклон кроны в градусах: дрожит после толчков и шлепков."""
        a = 0.0
        for f0, amp in ((128, 3.5), (196, 3.0), (312, 7.0)):
            if f0 <= f < f0 + 30:
                t = (f - f0) / 30
                a += amp * math.sin(2 * math.pi * (f - f0) / 7) * (1 - t)
        return a

    def on_tree(self, f, i):
        """Положение яблока, пока оно висит на качающейся кроне."""
        x, y = ON_TREE[i]
        piv = (TREE[0], TREE[1] - TRUNK_H)
        a = math.radians(self.shake(f))
        dx, dy = x - piv[0], y - piv[1]
        return piv[0] + dx * math.cos(a) - dy * math.sin(a), piv[1] + dx * math.sin(a) + dy * math.cos(a)

    def draw_tree(self, ctx, f):
        bx, by = TREE
        ctx.save()
        # ствол с корнями
        ctx.move_to(bx - TRUNK_W / 2 - 22, by)
        ctx.curve_to(bx - TRUNK_W / 2, by - 10, bx - TRUNK_W / 2, by - 40, bx - TRUNK_W / 2 + 4, by - TRUNK_H)
        ctx.line_to(bx + TRUNK_W / 2 - 4, by - TRUNK_H)
        ctx.curve_to(bx + TRUNK_W / 2, by - 40, bx + TRUNK_W / 2, by - 10, bx + TRUNK_W / 2 + 22, by)
        ctx.close_path()
        ctx.set_source_rgb(*bg.hexc('#8b5a2b')[:3])
        ctx.fill_preserve()
        ctx.set_source_rgb(0.08, 0.05, 0.05)
        ctx.set_line_width(5)
        ctx.stroke()
        ctx.set_source_rgb(*bg.hexc('#6e4520')[:3])
        ctx.set_line_width(3)
        for k, (yy, dx) in enumerate(((by - 70, -8), (by - 150, 10), (by - 230, -6))):
            ctx.move_to(bx + dx - 10, yy)
            ctx.curve_to(bx + dx - 4, yy - 12, bx + dx + 4, yy - 12, bx + dx + 10, yy - 24)
        ctx.stroke()
        # крона качается вокруг верхушки ствола
        piv = (bx, by - TRUNK_H)
        ctx.translate(*piv)
        ctx.rotate(math.radians(self.shake(f)))
        ctx.translate(-piv[0], -piv[1])
        cx, cy, R = CANOPY
        rng = random.Random(5)
        blobs = [(cx, cy, R * 0.72)]
        for k in range(10):
            a = 2 * math.pi * k / 10 + rng.uniform(-0.15, 0.15)
            blobs.append((cx + math.cos(a) * R * 0.62, cy + math.sin(a) * R * 0.48, R * rng.uniform(0.36, 0.44)))
        for x, y, r in blobs:
            ctx.new_sub_path()
            ctx.arc(x, y, r, 0, 2 * math.pi)
        ctx.set_source_rgb(0.08, 0.05, 0.05)
        ctx.set_line_width(10)
        ctx.stroke_preserve()
        ctx.set_source_rgb(*bg.hexc('#3fa83a')[:3])
        ctx.fill()
        for x, y, r in blobs[1:6]:
            ctx.new_sub_path()
            ctx.arc(x - r * 0.15, y - r * 0.2, r * 0.55, 0, 2 * math.pi)
        ctx.set_source_rgb(*bg.hexc('#5cc24c')[:3])
        ctx.fill()
        ctx.restore()

    # ================================================================ яблоки
    def apple(self, f, i):
        """(x, y, r, цвет, поворот, масштаб) или None, если яблоко съедено."""
        r, col = (34, GOLD) if i == GOLDEN else (26, RED)
        if i == APPLE_A:
            return self._apple_a(f, r, col)
        if i == GOLDEN:
            return self._golden(f, r, col)
        if i in HAIL:
            return self._hail(f, i, r, col)
        return self.on_tree(f, i) + (r, col, 0.0, 1.0)

    def _apple_a(self, f, r, col):
        if f < 132:
            return self.on_tree(f, APPLE_A) + (r, col, 0.0, 1.0)
        head = self.fat_top(144)
        if f < 144:
            x0, y0 = self.on_tree(132, APPLE_A)
            t = ease_in(seg(f, 132, 144))
            return lerp(x0, head[0], t), lerp(y0, head[1] - r, t), r, col, 0.0, 1.0
        m = self.mouth_pt(160)
        if f < 160:
            t = seg(f, 144, 160)
            x, y = bezier(t, (head[0], head[1] - r), (head[0] + 150, head[1] - 230), m)
            return x, y, r, col, 6 * t, 1.0
        if f < 164:
            return m[0], m[1], r, col, 0.0, 1 - seg(f, 160, 164)
        return None

    def _golden(self, f, r, col):
        if f < 200:
            return self.on_tree(f, GOLDEN) + (r, col, 0.0, 1.0)
        head = self.lp_top(210)
        if f < 210:
            x0, y0 = self.on_tree(200, GOLDEN)
            t = ease_in(seg(f, 200, 210))
            return lerp(x0, head[0], t), lerp(y0, head[1] - r, t), r, col, 0.0, 1.0
        m = self.mouth_pt(232)
        if f < 232:
            t = seg(f, 210, 232)
            x, y = bezier(t, (head[0], head[1] - r), (920, 120), m)
            return x, y, r, col, -8 * t, 1.0
        if f < 236:
            return m[0], m[1], r, col, 0.0, 1 - seg(f, 232, 236)
        return None

    def hail_times(self, k):
        f0 = 316 + k * 5
        return f0, f0 + 9, f0 + 24     # отрыв, удар по голове, на земле

    def suck_times(self, k):
        f0 = 384 + k * 4
        return f0, f0 + 9              # полёт в рот

    def _hail(self, f, i, r, col):
        k = HAIL.index(i)
        f0, f1, f2 = self.hail_times(k)
        if f < f0:
            return self.on_tree(f, i) + (r, col, 0.0, 1.0)
        top = self.fat_top(f1)
        hit = (top[0] + (k - 2.5) * 22, top[1] - r)
        if f < f1:
            x0, y0 = self.on_tree(f0, i)
            t = ease_in(seg(f, f0, f1))
            return lerp(x0, hit[0], t), lerp(y0, hit[1], t), r, col, 0.0, 1.0
        rest = self.rest[i]
        s0, s1 = self.suck_times(k)
        if f < f2:
            t = seg(f, f1, f2)
            x = lerp(hit[0], rest[0], t)
            y = lerp(hit[1], rest[1], t) - 180 * math.sin(math.pi * t) * (1 - 0.3 * t)
            return x, y, r, col, 10 * t * (1 if rest[0] > hit[0] else -1), 1.0
        if f < s0:
            return rest[0], rest[1], r, col, 0.0, 1.0
        if f < s1:
            m = self.mouth_pt(s1)
            t = ease_in(seg(f, s0, s1))
            return lerp(rest[0], m[0], t), lerp(rest[1], m[1], t) - 60 * math.sin(math.pi * t), r, col, 9 * t, 1 - 0.6 * t
        return None

    def shot(self, f, n):
        """Яблоко-снаряд n: из рта толстого в цель на Ла Писе."""
        f0, f1, part = SHOTS[n]
        if not f0 <= f < f1 + 14:
            return None
        m = self.mouth_pt(f0)
        tgt = self.shot_target(part)
        r = 34 if n == 2 else 26
        col = GOLD if n == 2 else RED
        if f < f1:
            t = seg(f, f0, f1)
            x, y = bezier(t, m, ((m[0] + tgt[0]) / 2, min(m[1], tgt[1]) - 120), tgt)
            return x - r * 0.8, y, r, col, 12 * t, 1.0
        # отскок вниз на землю
        t = seg(f, f1, f1 + 14)
        x = lerp(tgt[0] - r * 0.8, tgt[0] - 140, t)
        y = lerp(tgt[1], G - r, t) - 120 * math.sin(math.pi * t)
        return x, y, r, col, -10 * t, 1.0

    def shot_target(self, part):
        """Точка попадания на Ла Писе (кадр удара)."""
        def calc():
            f = {'head': 434, 'belly': 446, 'face': 458}[part]
            p = self.lapeace(f - 1)
            pt = {'head': (0.12, -0.80), 'belly': (0.18, 0.35), 'face': (0.30, -0.45)}[part]
            return self.lp.joint(p, 'head' if part != 'belly' else 'torso', pt)
        return self._memo(('tgt', part), calc)

    # ================================================================ толстый
    def fat_top(self, f):
        p = self.fat(f)
        return self.fat_r.point(p, (0.03, -0.177))

    def mouth_pt(self, f):
        p = self.fat(f)
        q = p if p.get('mouth_s') else dict(p, mouth='happy', mouth_s=(2.0, 2.0), mouth_off=(0.0, 0.12))
        c = self.fat_r.mouth_c['happy']
        off = q['mouth_off']
        return self.fat_r.point(q, (c[0] + off[0], c[1] + off[1]), face=True)

    def fat(self, f):
        key = ('fat', f)
        if key not in self._cache:
            self._cache[key] = self._fat(f)
        return self._cache[key]

    def _fat(self, f):
        p = dict(x=FX0, dir=1, face_shift=0.12, eyes='normal', mouth='smile normal')
        x, lift, sx, sy, scale = FX0, 0.0, 1.0, 1.0, 1.0
        open_mouth = None
        # стойка: смотрит на Ла Писа, облизывается
        if 20 <= f < 96:
            p['eyes'] = 'angry'
            p['mouth'] = 'happy' if (f // 10) % 2 == 0 and 40 <= f < 80 else 'theeth smile'
        # прыжки к дереву
        if 96 <= f < 124:
            if f < 110:
                x, lift = hop(f, 98, 108, FX0, 540, 60)
                sx, sy = ball_squash(f, 98, 108, 2, 2)
            else:
                x, lift = hop(f, 112, 122, 540, FX - 30, 60)
                sx, sy = ball_squash(f, 112, 122, 2, 2)
        elif 124 <= f < 140:
            # толчок животом в ствол
            if f < 128:
                x = lerp(FX - 30, FX + 12, ease_in(seg(f, 124, 128)))
            elif f < 132:
                x, sx, sy = FX + 12, 0.9, 1.08
            else:
                x = lerp(FX + 12, FX, ease_out(seg(f, 132, 140)))
            p['eye_dy'] = -0.04
        elif f >= 140:
            x = FX
        # яблоко по голове, потом в рот
        if 144 <= f < 148:
            sx, sy = 1.1, 0.9
            p.update(eyes='sad', mouth='puzzlement')
        if 148 <= f < 164:
            open_mouth = ease_out(seg(f, 148, 154))
        if 164 <= f < 190:
            ph = ((f - 164) // 4) % 2
            p['mouth'] = 'theeth smile' if ph == 0 else 'smile normal'
            sx, sy = (1.06, 0.96) if ph == 0 else (1.0, 1.02)
        if 190 <= f < 214:
            p['mouth'] = 'happy'
        # золотое яблоко летит — открывает рот
        if 214 <= f < 236:
            open_mouth = ease_out(seg(f, 214, 222))
            p['eye_s'] = (1.2, 1.2)
        if 236 <= f < 252:
            ph = ((f - 236) // 4) % 2
            p['mouth'] = 'theeth smile' if ph == 0 else 'smile normal'
        if 252 <= f < 300:
            p['mouth'] = 'happy'
            sx, sy = (1.05, 0.95) if ((f - 252) // 4) % 2 == 0 else (0.97, 1.03)
        if 300 <= f < 316:
            p.update(mouth='puzzlement', eyes='normal', eye_dy=-0.05)
        # град яблок
        if 316 <= f < 376:
            p.update(eyes='sad', mouth='puzzlement')
            for k in range(len(HAIL)):
                f1 = self.hail_times(k)[1]
                if f1 <= f < f1 + 4:
                    sx, sy = 1.1, 0.9
        if 376 <= f < 384:
            p.update(eyes='angry', mouth='theeth smile')
            x += tremble(f, 3)
        # засасывает яблоки и раздувается
        if 380 <= f < 412:
            open_mouth = ease_out(seg(f, 380, 388))
            p['eyes'] = 'angry'
            eaten = sum(1 for k in range(len(HAIL)) if f >= self.suck_times(k)[1])
            scale = 1.0 + 0.045 * eaten
        if f >= 412:
            scale = 1.27
            p.update(eyes='angry', mouth='smile normal')
        # присел, задрожал, три выстрела
        if 414 <= f < 426:
            t = ease_out(seg(f, 414, 420))
            sx, sy = lerp(1.0, 1.12, t), lerp(1.0, 0.88, t)
            x += tremble(f, 3) * (f >= 418)
        for n, (f0, f1, _) in enumerate(SHOTS):
            if f0 - 2 <= f < f0 + 6:
                open_mouth = 0.8
                k = seg(f, f0 - 2, f0 + 2)
                sx, sy = lerp(1.0, 0.92, k), lerp(1.0, 1.1, k)
            if f >= f0:
                scale = 1.27 - 0.09 * (n + 1)
        if f >= 464:
            p.update(eyes='normal', mouth='happy')
        # к центру и радуется
        if 490 <= f < 520:
            if f < 504:
                x, lift = hop(f, 492, 504, FX, 810, 70)
                sx, sy = ball_squash(f, 492, 504, 2, 4)
            else:
                x, lift = hop(f, 506, 518, 810, CENTER, 70)
                sx, sy = ball_squash(f, 506, 518, 2, 6)
        elif f >= 520:
            x = CENTER
            if 528 <= f < 538:
                p['mouth'] = 'puzzlement'          # отрыжка
            if f >= 540:
                p['face_shift'] = lerp(0.12, 0.0, seg(f, 540, 544))
            for a in (548, 570):
                if a - 4 <= f < a + 20:
                    _, lift = hop(f, a, a + 12, CENTER, CENTER, 70)
                    sx, sy = ball_squash(f, a, a + 12, 4, 8)
        if open_mouth is not None:
            p.update(mouth='happy', mouth_s=(lerp(1.0, 2.0, open_mouth),) * 2,
                     mouth_off=(0.0, lerp(0.0, 0.12, open_mouth)), eye_dy=lerp(0.0, -0.05, open_mouth))
        p.update(x=x, y=G - lift, sx=sx, sy=sy, scale=scale)
        return p

    # ================================================================ Ла Пис
    STAND = dict(x=LP0, y=G - HOV, dir=-1, lean=0.0, head=0.0, armF=REST, armN=REST,
                 sw_mouth='mouth smile', eyes=(1.0, 1.0), scale=1.0)

    def lp_top(self, f):
        return self.lp.joint(self.lapeace(f), 'head', (0.04, -0.96))

    def lapeace(self, f):
        key = ('lp', f)
        if key not in self._cache:
            self._cache[key] = self._lapeace(f)
        return self._cache[key]

    def _lapeace(self, f):
        if f >= 490:
            return None
        lp = self.lp
        keys = [
            (0, dict(self.STAND)),
            (160, {}), (166, dict(sw_mouth='mouth smile theeth')),
            # получил золотым по макушке
            (210, dict(eyes=(1.35, 1.35), sw_mouth='mouth sad', head=10.0)),
            (216, dict(eyes=(1.0, 0.5), head=0.0)),
            (236, dict(eyes=(1.0, 0.45))),
            # двойной удар по стволу
            (286, {}), (298, dict(lean=-12.0, armF=(150.0, 20.0, 0.0), armN=(-150.0, -20.0, 0.0), sw_mouth='mouth smile theeth')),
            (309, {}, 'in'), (312, dict(lean=16.0)),
            (312, dict(armF=REST, armN=REST)), (330, {}), (342, dict(lean=0.0)),
            (372, dict(sw_mouth='mouth smile theeth', eyes=(1.0, 1.0))),
            # видит раздутого толстого
            (412, {}), (416, dict(sw_mouth='mouth sad', eyes=(1.3, 1.3))),
        ]
        p = pose_keys(f, keys)
        # подплывает к дереву, покачиваясь только в движении
        if 150 <= f < 182:
            t = seg(f, 150, 182)
            p['x'] = lerp(LP0, LPX, ease_io(t))
            p['y'] = G - HOV - 6 * math.sin(2 * math.pi * (f - 150) / 16) * (1 - t)
        elif f >= 182:
            p['x'] = LPX
        # гладит бороду
        for a, b in ((40, 76), (166, 186), (372, 404)):
            if a - 6 <= f < b + 6:
                q = dict(p, armN=REST)
                beard = lp.joint(q, 'head', BEARD_LP)
                stroke = beard[0], beard[1] + 14 * math.sin(2 * math.pi * (f - a) / 10)
                tgt = lp.arm_ik(q, 'N', stroke, tip=(-0.344, 0.45))
                p['armN'] = lerp(REST, tgt, ease_io(min(seg(f, a - 6, a), 1 - seg(f, b, b + 6))))
        # шлепок по стволу (196)
        trunk = (TREE[0] + TRUNK_W / 2 + 2, TREE[1] - 250)
        if 188 <= f < 206:
            hit = lp.arm_ik(dict(p, armF=REST), 'F', trunk, tip=TIP_LP)
            wind = (-40.0, 20.0, 0.0)
            if f < 192:
                p['armF'] = lerp(REST, wind, ease_io(seg(f, 188, 192)))
            elif f < 196:
                p['armF'] = lerp(wind, hit, ease_in(seg(f, 192, 196)))
            elif f < 200:
                p['armF'] = hit
            else:
                p['armF'] = lerp(hit, REST, ease_io(seg(f, 200, 206)))
        # двойной удар: обе ладони в ствол (312)
        if 309 <= f < 330:
            q = dict(p, lean=16.0)
            hitF = lp.arm_ik(dict(q, armF=REST), 'F', (trunk[0], trunk[1] - 40), tip=TIP_LP)
            hitN = lp.arm_ik(dict(q, armN=REST), 'N', (trunk[0] + 4, trunk[1] + 30), tip=(-0.344, 0.50))
            if f < 312:
                t = ease_in(seg(f, 309, 312))
                p['armF'] = lerp((150.0, 20.0, 0.0), hitF, t)
                p['armN'] = lerp((-150.0, -20.0, 0.0), hitN, t)
            elif f < 322:
                p['armF'], p['armN'] = hitF, hitN
            else:
                t = ease_io(seg(f, 322, 330))
                p['armF'] = lerp(hitF, REST, t)
                p['armN'] = lerp(hitN, REST, t)
        if 300 <= f < 309:
            p['x'] = LPX + tremble(f, 3)
        # попадания яблоками
        if 434 <= f < 446:
            p.update(head=-14.0 * (1 - seg(f, 434, 444)), eyes=(1.0, 0.5), sw_mouth='mouth sad')
        if 446 <= f < 458:
            p.update(lean=-12.0 * (1 - seg(f, 446, 456)), eyes=(1.3, 1.3), sw_mouth='mouth sad',
                     x=LPX + 20 * math.sin(math.pi * seg(f, 446, 452)))
        if f >= 458:
            t = seg(f, 460, 488)
            p.update(eyes=(1.4, 1.4), sw_mouth='mouth sad', head=-20.0,
                     armF=(120.0, 20.0, 0.0), armN=(-120.0, -20.0, 0.0))
            if f >= 460:
                p.update(x=LPX + 820 * ease_out(t), y=G - HOV - 520 * math.sin(math.pi * t * 0.7) - 200 * t,
                         rot=-900 * t)
        return p

    # ================================================================ кадр
    def draw(self, ctx, f):
        ctx.save()
        self.cam.apply(ctx, f)
        ctx.set_source_surface(self.bg, -bg.M, -bg.M)
        ctx.paint()
        self.clouds.draw(ctx, f)

        fat, lp = self.fat(f), self.lapeace(f)
        green = (0.1, 0.35, 0.05)
        fx.shadow(ctx, TREE[0], G + 6, 260, 0, green)
        fx.shadow(ctx, fat['x'], G + 4, 470 * fat['sx'] * fat['scale'], G - fat['y'], green)
        if lp and f < 462:
            fx.shadow(ctx, lp['x'], G + 4, 230, 10, green)

        self.draw_tree(ctx, f)
        # яблоки на дереве — за персонажами; летящие — перед ними
        flying = []
        for i in range(len(ON_TREE)):
            a = self.apple(f, i)
            if a is None:
                continue
            if a[:2] == self.on_tree(f, i):
                draw_apple(ctx, *a[:5])
            else:
                flying.append(a)
        self.fat_r.draw(ctx, fat)
        if lp:
            self.lp.draw(ctx, lp)
        for a in flying:
            draw_apple(ctx, a[0], a[1], a[2] * a[5], a[3], a[4])
        for n in range(len(SHOTS)):
            a = self.shot(f, n)
            if a:
                draw_apple(ctx, *a[:5])
        self.effects(ctx, f, fat, lp)
        ctx.restore()
        fx.flash(ctx, self.cam.flash_alpha(f))

    def effects(self, ctx, f, fat, lp):
        top = self.fat_top(f)
        if 30 <= f < 96:
            fx.drool(ctx, *self.fat_r.point(fat, (0.25, 0.25), face=True), f, 1.2)
        fx.dust(ctx, 540, G, f - 108, n=4, spread=80, size=0.6, seed=1)
        fx.dust(ctx, FX - 30, G, f - 122, n=4, spread=80, size=0.6, seed=2)
        fx.spark(ctx, TREE[0] - TRUNK_W / 2, G - 130, f - 128, 0.6)
        fx.spark(ctx, top[0], top[1] - 10, f - 144, 0.5)
        if 146 <= f < 160:
            fx.dizzy(ctx, top[0], top[1] - 40, f - 146, rx=80, n=3, size=0.8)
        # Ла Пис: шлепок, золотое яблоко по макушке
        fx.spark(ctx, TREE[0] + TRUNK_W / 2, G - 250, f - 196, 0.6)
        if lp:
            lt = self.lp_top(f)
            fx.spark(ctx, *self.lp_top(210), f - 210, 0.6)
            if 212 <= f < 240:
                fx.dizzy(ctx, lt[0], lt[1] - 30, f - 212, rx=80, n=3, size=0.9)
            if 240 <= f < 300:
                fx.anger(ctx, lt[0] - 70, lt[1] + 70, f, 1.1)
                fx.steam(ctx, lt[0], lt[1] + 20, f - 240, 1.1)
            if 416 <= f < 432:
                fx.sweat(ctx, lt[0] - 110, lt[1] + 90, f - 416, 1.1, side=-1)
        # двойной удар — град
        fx.spark(ctx, TREE[0] + TRUNK_W / 2, G - 230, f - 312, 1.0)
        for k in range(len(HAIL)):
            f1 = self.hail_times(k)[1]
            fx.spark(ctx, top[0] + (k - 2.5) * 22, top[1] - 10, f - f1, 0.35, dur=6)
        if 340 <= f < 380:
            fx.dizzy(ctx, top[0], top[1] - 40, f - 340, rx=95)
        if 376 <= f < 392:
            fx.anger(ctx, top[0] - 120, top[1] + 60, f, 1.3)
        # выстрелы
        for n, (f0, f1, part) in enumerate(SHOTS):
            tgt = self.shot_target(part)
            fx.spark(ctx, tgt[0], tgt[1], f - f1, 0.7 if n < 2 else 1.2)
            if f0 <= f < f0 + 8:
                m = self.mouth_pt(f0)
                fx.puff_cloud(ctx, m[0] + 40, m[1], 26 * (1 + seg(f, f0, f0 + 8)), 1 - seg(f, f0, f0 + 8), seed=n)
        if lp and 446 <= f < 460:
            fx.dizzy(ctx, *self.lp_top(f), f - 446, rx=70, n=3, size=0.8)
        fx.twinkle(ctx, 1860, 70, f - 482, 1.4, dur=22)
        # к центру и празднует
        fx.dust(ctx, 810, G, f - 504, n=4, spread=90, size=0.6, seed=3)
        fx.dust(ctx, CENTER, G, f - 518, n=6, spread=140, size=0.8, seed=4)
        if 528 <= f < 546:
            m = self.mouth_pt(528)
            fx.puff_cloud(ctx, m[0] + 30, m[1] - 20 - (f - 528) * 3, 22 + (f - 528), 1 - seg(f, 528, 546),
                          fill=(1, 1, 1), line=(0.55, 0.6, 0.65), seed=7, n=5)
        if f >= 544:
            for i, (dx, dy, ph) in enumerate(((-360, -560, 0), (330, -620, 7), (-440, -260, 13),
                                               (430, -320, 4), (-220, -700, 10), (260, -160, 16))):
                fx.twinkle(ctx, CENTER + dx, G + dy, (f - 544 + ph * 2) % 26, 0.9, dur=22)
