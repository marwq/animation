"""Толстый против Скелета. Луг у гор, день. 25 с = 600 кадров.

 0–4 с      стойка по краям, лицом друг к другу: скелет зло подпрыгивает на месте,
            толстый хлопает себя по животу и ухмыляется
 4–8 с      скелет прыжками летит лбом в живот — живот пружинит, как батут,
            скелет отлетает кувырком, звёздочки; толстый смеётся
 8–14 с     скелет катится в атаку — толстый раскрывает огромный рот и засасывает:
            летят трава, листья, камушки, скелет упирается, скользит — и проглочен.
            Толстый жуёт, морщится (костлявый!), надувается и выплёвывает его
            через весь экран в слюнях
 14–17 с    скелет в слюнях злится → ухмылка, лучи → дым → крылатый скелет;
            толстый пугается
 17–19.5 с  скелет пикирует на толстого — тот приседает, дрожит и подпрыгивает,
            скелет пролетает под ним и врезается лицом в землю
 19.5–20.5 с толстый всем весом садится ему на спину — нокаут, звёздочки
 20.5–25 с  толстый отскакивает в центр, поворачивается к зрителю и радуется
"""
import math
import random

import bg
import fx
from anim import Camera, ball_squash, hop, lerp, pose_keys, seg
from fx import ease_in, ease_io, ease_out  # noqa: F401
from rig import GROUND_Y as G, SKELETON_BIG, Ball, Big

FX = 430                        # толстый
SB = 1490                       # скелет-шарик в стойке
SB2 = 1460                      # куда его отбрасывает живот
SL = 1480                       # куда он прилетает после плевка (и превращается)
LX = 1000                       # центр лежащего скелета
FX2 = 640                       # толстый выходит ближе к центру перед пике
JUMP, LAND = 426, 464            # прыжок толстого и посадка на спину скелета
DIVE, CRASH = 430, 454           # пике скелета и удар о землю
CENTER = 960                    # тут толстый садится скелету на спину и празднует
BACK_H = 238                    # высота спины лежащего скелета под толстым
REST = (0.0, 0.0, 0.0)

BELLY_R = 243                   # край живота толстого от центра на высоте шарика, px
BALL_R = 150                    # радиус шарика, px
GIANT = dict(mouth='happy', mouth_s=(2.2, 2.2), mouth_off=(-0.02, 0.14), eye_dy=-0.06)


def tremble(f, amp, seed=0):
    return random.Random(f * 31 + seed).uniform(-amp, amp)


def bezier(t, p0, p1, p2):
    u = 1 - t
    return (u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0],
            u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1])


class Film:
    frames = 600

    def __init__(self):
        self.bg = bg.meadow('mountains', seed=23)
        self.clouds = bg.Clouds(seed=13)
        self.fat_r = Ball('fat')
        self.sb_r = Ball('skeleton_small')
        self.sk = Big(SKELETON_BIG)
        self.big_half = (SKELETON_BIG['sole'] - SKELETON_BIG['top']) * self.sk.k / 2   # 410 px
        self._cache = {}
        rng = random.Random(4)
        # мусор, который засасывает рот: (кадр, откуда, вид, зерно)
        self.debris = []
        for i in range(40):
            f0 = 226 + i * 0.9 + rng.uniform(0, 2)
            src = (rng.uniform(820, 1750), rng.uniform(760, 960))
            self.debris.append((f0, src, rng.choice(['blade', 'blade', 'leaf', 'pebble', 'puff']), i))
        c = self.cam = Camera()
        c.shake(28, 4, 3); c.shake(36, 4, 3)
        c.shake(137, 8, 8); c.punch(137, 10, 0.05, (690, 790))
        c.shake(164, 6, 6)
        c.shake(268, 6, 5)
        c.shake(316, 8, 8); c.punch(316, 10, 0.05, self.mouth_pt(316))
        c.shake(340, 8, 10)
        c.flash(388, 3, 0.45); c.shake(388, 7, 10); c.punch(388, 10, 0.05, (SL, 600))
        c.shake(CRASH, 10, 14)
        c.flash(464, 4, 0.45); c.shake(464, 20, 26); c.punch(464, 16, 0.12, (CENTER, 700))
        c.shake(486, 5, 6); c.shake(548, 5, 6); c.shake(572, 5, 6)

    # ---------------------------------------------------------------- геометрия
    def mouth_pt(self, f):
        """Центр раскрытого рта в кадре (огромного, если рот сейчас обычный)."""
        p = self.fat(f)
        q = p if p.get('mouth_s') else dict(p, **GIANT)
        c = self.fat_r.mouth_c['happy']
        off = q['mouth_off']
        return self.fat_r.point(q, (c[0] + off[0], c[1] + off[1]), face=True)

    # ================================================================ толстый
    def fat(self, f):
        key = ('fat', f)
        if key not in self._cache:
            self._cache[key] = self._fat(f)
        return self._cache[key]

    def _fat(self, f):
        p = dict(x=FX, dir=1, face_shift=0.08, eyes='normal', mouth='smile normal')
        x, lift, sx, sy = FX, 0.0, 1.0, 1.0
        # стойка: хлопает по животу — живот колышется
        if 44 <= f < 70:
            t = f - 44
            k = 0.06 * math.sin(2 * math.pi * t / 8) * (1 - t / 26)
            sx, sy = 1 + k, 1 - k
        if f >= 44:
            p['mouth'] = 'theeth smile'
        # живот-батут
        if 134 <= f < 137:
            p.update(mouth='puzzlement')
        elif 137 <= f < 141:
            sx, sy = 0.88, 1.10
            p.update(mouth='puzzlement')
        elif 141 <= f < 147:
            t = seg(f, 141, 147)
            sx, sy = lerp(1.16, 1.0, ease_out(t)), lerp(0.88, 1.0, ease_out(t))
        # смеётся
        if 150 <= f < 198:
            p.update(mouth='happy')
            sx, sy = (1.05, 0.95) if ((f - 150) // 4) % 2 == 0 else (0.97, 1.03)
        if 198 <= f < 214:
            p.update(mouth='theeth smile')
        # огромный рот
        if 214 <= f < 268:
            t = ease_out(seg(f, 214, 222))
            p.update(mouth='happy', mouth_s=(lerp(1.0, 2.2, t),) * 2,
                     mouth_off=(lerp(0.0, -0.02, t), lerp(0.0, 0.14, t)), eye_dy=lerp(0.0, -0.06, t))
            if f >= 226:
                sy = 1.02 + 0.015 * math.sin(f * 1.1)       # тянет воздух
        # проглотил: щёки раздуты, жуёт
        if 268 <= f < 272:
            sx, sy = 1.14, 0.93
        elif 272 <= f < 296:
            ph = ((f - 272) // 4) % 2
            p['mouth'] = 'theeth smile' if ph == 0 else 'smile normal'
            sx, sy = (1.07, 0.95) if ph == 0 else (1.0, 1.02)
        elif 296 <= f < 308:
            # морщится — костлявый!
            p.update(eyes='sad', mouth='puzzlement')
            x += tremble(f, 4)
        elif 308 <= f < 316:
            t = ease_out(seg(f, 308, 314))
            p.update(eyes='angry', mouth='smile normal')
            sx, sy = lerp(1.0, 1.13, t), lerp(1.0, 1.12, t)
        elif 316 <= f < 324:
            t = seg(f, 316, 324)
            p.update(eyes='angry', mouth='happy', mouth_s=(1.6, 1.6), mouth_off=(-0.01, 0.08))
            sx, sy = lerp(0.9, 1.0, t), lerp(1.08, 1.0, t)
        elif 324 <= f < 346:
            p.update(mouth='happy')
            sx, sy = (1.05, 0.95) if ((f - 324) // 4) % 2 == 0 else (0.97, 1.03)
        # испугался превращения, потом собрался и вышел к центру
        if 392 <= f < 402:
            p.update(mouth='puzzlement', eye_s=(1.3, 1.3))
            x += tremble(f, 3)
        elif f >= 402:
            p.update(eyes='angry', mouth='theeth smile')
        if 402 <= f < 416:
            x, lift = hop(f, 404, 414, FX, FX2, 55)
            sx, sy = ball_squash(f, 404, 414, 2, 2)
        # присел, дрожит, прыгает вперёд-вверх — скелет пролетает под ним; садится сверху
        elif 416 <= f < JUMP:
            x = FX2 + tremble(f, 3) * (f >= 420)
            t = ease_out(seg(f, 416, 420))
            sx, sy = lerp(1.0, 1.2, t), lerp(1.0, 0.8, t)
            p['mouth'] = 'smile normal'
        elif JUMP <= f < LAND:
            x = lerp(FX2, CENTER, ease_io(seg(f, JUMP + 4, LAND)))
            if f < JUMP + 3:
                sx, sy = 0.84, 1.18
            if f < JUMP + 12:
                lift = 340 * ease_out(seg(f, JUMP, JUMP + 12))
            elif f < LAND - 6:
                lift = 340 + 12 * math.sin(math.pi * seg(f, JUMP + 12, LAND - 6))
            else:
                lift = lerp(340, BACK_H, ease_in(seg(f, LAND - 6, LAND)))
                sx, sy = 0.9, 1.12
            p.update(mouth='theeth smile', eyes='angry')
        elif f >= 464:
            x, lift = CENTER, BACK_H
            p.update(mouth='happy', eyes='normal')
            if f < 470:
                sx, sy = (1.3, 0.7) if f < 467 else (1.1, 0.9)
            for a, h in ((474, 70), (536, 80), (560, 80)):
                if a - 4 <= f < a + 20:
                    _, l2 = hop(f, a, a + 12, CENTER, CENTER, h)
                    lift = BACK_H + l2
                    sx, sy = ball_squash(f, a, a + 12, 4, 8)
            if 492 <= f < 520:
                sx, sy = (1.05, 0.95) if ((f - 492) // 4) % 2 == 0 else (0.97, 1.03)
            if f >= 524:
                p['face_shift'] = lerp(0.08, 0.0, seg(f, 524, 528))
        p.update(x=x, y=G - lift, sx=sx, sy=sy)
        return p

    # ================================================================ скелет-шарик
    def ball(self, f):
        key = ('ball', f)
        if key not in self._cache:
            self._cache[key] = self._ball(f)
        return self._cache[key]

    def _ball(self, f):
        if f >= 392:
            return None
        p = dict(dir=-1, face_shift=0.06, eyes='angry', mouth='smile normal')
        x, lift, sx, sy, rot, scale = SB, 0.0, 1.0, 1.0, 0.0, 1.0
        # стойка: два злых подскока на месте
        for a in (16, 30):
            if a - 4 <= f < a + 12:
                _, lift = hop(f, a, a + 8, SB, SB, 45)
                sx, sy = ball_squash(f, a, a + 8, 4, 4)
        if 16 <= f < 96:
            p['mouth'] = 'theeth smile'
        if 70 <= f < 84:
            x += tremble(f, 2)
        # прыжки в живот
        if 96 <= f < 131:
            p['mouth'] = 'theeth smile'
            if f < 116:
                x, lift = hop(f, 100, 112, SB, 1250, 80)
                sx, sy = ball_squash(f, 100, 112, 4, 4)
            else:
                x, lift = hop(f, 116, 128, 1250, 1010, 60)
                sx, sy = ball_squash(f, 116, 128, 4, 3)
        elif 131 <= f < 140:
            contact = FX + BELLY_R * 0.88 + BALL_R * 0.78
            if f < 137:
                t = ease_in(seg(f, 131, 137))
                x = lerp(1010, contact, t)
                lift = 24 * math.sin(math.pi * seg(f, 131, 137))
                sx, sy = 0.84, 1.15
            else:
                x, sx, sy = contact, 0.78, 1.2
            p['mouth'] = 'theeth smile'
        elif 140 <= f < 186:
            p.update(eyes='sad', mouth='puzzlement')
            contact = FX + BELLY_R * 0.88 + BALL_R * 0.78
            if f < 164:
                t = seg(f, 140, 164)
                x, lift, rot = lerp(contact, SB2, ease_out(t)), 4 * 330 * t * (1 - t), -720 * ease_out(t)
                if f < 143:
                    sx, sy = lerp(0.78, 1.0, seg(f, 139, 143)), lerp(1.2, 1.0, seg(f, 139, 143))
            else:
                x = SB2
                if f < 166:
                    sx, sy = 1.35, 0.65
                elif f < 174:
                    t = seg(f, 166, 174)
                    lift = 45 * 4 * t * (1 - t)
                else:
                    t = seg(f, 174, 182)
                    sx, sy = lerp(1.12, 1.0, ease_out(t)), lerp(0.88, 1.0, ease_out(t))
        elif 186 <= f < 208:
            x = SB2
            p.update(eyes='angry' if f >= 196 else 'sad', mouth='theeth smile')
            if f >= 196:
                x += tremble(f, 3)
        # катится в атаку
        elif 208 <= f < 224:
            t = ease_in(seg(f, 208, 224))
            x = lerp(SB2, 1150, t)
            rot = (SB2 - x) / BALL_R * 57.3
            p.update(eyes='angry', mouth='theeth smile')
        elif 224 <= f < 258:
            # увидел рот — тормозит, упирается, но его тянет
            p.update(eyes='normal', mouth='puzzlement', eye_s=(1.3, 1.3))
            roll = (SB2 - 1150) / BALL_R * 57.3
            if f < 230:
                x = lerp(1150, 1110, ease_out(seg(f, 224, 230)))
                sx, sy = 1.15, 0.88
                rot = lerp(roll, -15.0, ease_out(seg(f, 224, 230)))   # откатывается назад
            else:
                t = ease_in(seg(f, 230, 258))
                x = lerp(1110, 930, t) + tremble(f, 3)
                rot = -15 + 18 * math.sin(f * 0.9)
                sx, sy = 1.08, 0.93
                p.update(eyes='sad')
        elif 258 <= f < 268:
            # оторвало от земли — летит прямо в рот
            t = ease_in(seg(f, 258, 268))
            m = self.mouth_pt(266)
            cx, cy = lerp(930, m[0], t), lerp(G - BALL_R, m[1], t) - 60 * math.sin(math.pi * t)
            scale = lerp(1.0, 0.3, t)
            x, lift = cx, G - (cy + BALL_R * scale)
            rot = 300 * t
            p.update(eyes='sad', mouth='puzzlement')
        elif 268 <= f < 316:
            return None                    # внутри толстого
        elif 316 <= f < 340:
            # выплюнут через весь экран
            t = seg(f, 316, 340)
            m = self.mouth_pt(316)
            scale = lerp(0.35, 1.0, ease_out(seg(f, 316, 322)))
            c0 = (m[0], m[1])
            c1 = (1150, 260)
            c2 = (SL, G - BALL_R)
            cx, cy = bezier(t, c0, c1, c2)
            x, lift = cx, G - (cy + BALL_R * scale)
            rot = -720 * t
            p.update(eyes='sad', mouth='puzzlement')
        elif f >= 340:
            x = SL
            p.update(eyes='sad', mouth='puzzlement')
            if f < 342:
                sx, sy = 1.35, 0.65
            elif f < 350:
                t = seg(f, 342, 350)
                lift = 35 * 4 * t * (1 - t)
            elif f < 358:
                t = seg(f, 350, 358)
                sx, sy = lerp(1.1, 1.0, t), lerp(0.9, 1.0, t)
            if f >= 356:
                p.update(eyes='angry', mouth='theeth smile')
                x += tremble(f, 2)
            if f >= 374:
                p.update(mouth='theeth smile')
                x += tremble(f, 6, 1)
                scale = lerp(1.0, 1.1, seg(f, 374, 388))
        p.update(x=x, y=G - lift, sx=sx, sy=sy, rot=rot, scale=scale)
        return p

    # ================================================================ большой скелет
    STAND = dict(x=SL, dir=-1, wings=20.0, hip=(0.0, 0.0), lean=0.0, head=0.0,
                 armF=(10.0, 20.0, 0.0), armN=(-8.0, 18.0, 0.0), footF=(0.0, 0.0), footN=(0.0, 0.0),
                 eyes=(1.0, 0.6), mouth=(1.0, 1.0), face_shift=0.035, scale=1.0, y=G)
    LYING = dict(wings=-106.0, lean=0.0, head=6.0, hip=(0.0, 0.0), armF=(-10.0, 15.0, 0.0),
                 armN=(10.0, 15.0, 0.0), footF=(0.0, 0.0), footN=(0.0, 0.0), eyes=(1.0, 0.15))

    def big(self, f):
        key = ('big', f)
        if key not in self._cache:
            self._cache[key] = self._big(f)
        return self._cache[key]

    def at_center(self, p, cx, cy):
        """Поставить большого по центру тела (вращение идёт вокруг него)."""
        p['x'] = cx
        p['y'] = cy + self.big_half * p.get('scale', 1.0)
        return p

    def _big(self, f):
        if f < 390:
            return None
        keys = [
            (390, dict(self.STAND, scale=0.55), 'lin'),
            (394, dict(scale=1.1)), (397, dict(scale=0.96)), (400, dict(scale=1.0)),
            (410, {}),
            (424, dict(hip=(0.0, 0.12), lean=12.0, head=-6.0, wings=45.0,
                       armF=(-30.0, 25.0, 0.0), armN=(-35.0, 25.0, 0.0), eyes=(1.0, 0.5))),
        ]
        p = pose_keys(f, keys)
        if 424 <= f < DIVE:
            p['x'] = SL + tremble(f, 3)
        if DIVE <= f < CRASH:
            # пике: низко над землёй, руки вперёд, крылья назад
            t = seg(f, DIVE, CRASH)
            cx = lerp(SL, 1100, t)
            cy = G - lerp(self.big_half, 175, ease_out(seg(f, DIVE, DIVE + 10)))
            # «торпеда»: руки и крылья прижаты вдоль тела, впереди череп
            p.update(hip=(0.0, 0.0), lean=0.0, head=-15.0, wings=lerp(45.0, -106.0, ease_out(seg(f, DIVE, DIVE + 8))),
                     armF=(-12.0, 4.0, 0.0), armN=(12.0, 4.0, 0.0), footF=(0.03, -0.02), footN=(-0.02, -0.04),
                     rot=lerp(0.0, 80.0, ease_out(seg(f, DIVE, DIVE + 10))), eyes=(1.0, 0.5))
            if f >= DIVE + 12:
                p['eyes'] = (1.35, 1.35)        # толстого на месте нет — промах!
            self.at_center(p, cx, cy)
        elif f >= CRASH:
            # врезался лицом в землю и проехал; потом на него садятся
            p.update(self.LYING)
            cx = lerp(1100, LX, ease_out(seg(f, CRASH, CRASH + 6)))
            p['rot'] = 90.0
            squash = 0.0
            for a in (464, 486, 548, 572):          # толстый приземляется на спину
                if a <= f < a + 8:
                    squash = max(squash, (0.3 if a == 464 else 0.12) * (1 - ease_out(seg(f, a + 1, a + 8))))
            if squash:
                p['sx'] = 1 - squash
                p['footF'], p['footN'] = (0.0, -0.4 * squash), (0.0, -0.25 * squash)
                p['wings'] = -106.0 + 150 * squash
            if f >= 500 and (f - 500) % 30 < 4:
                p['footN'] = (0.0, -0.04)       # подёргивается
            self.at_center(p, cx, G - 135 + 60 * squash)
        return p

    # ================================================================ эффекты
    def draw_debris(self, ctx, f):
        if not 226 <= f < 272:
            return
        m = self.mouth_pt(240)
        for f0, src, kind, seed in self.debris:
            age = f - f0
            dur = 14
            if not 0 <= age < dur:
                continue
            t = ease_in(age / dur)
            ctrl = ((src[0] + m[0]) / 2, min(src[1], m[1]) - 80 + (seed % 3) * 40)
            x, y = bezier(t, src, ctrl, m)
            s = 1.8 * (1 - 0.85 * t)
            rng = random.Random(seed)
            ctx.save()
            ctx.translate(x, y)
            ctx.rotate(age * 0.6 + seed)
            ctx.scale(s, s)
            if kind == 'blade':
                ctx.move_to(-3, 14)
                ctx.curve_to(-4, 0, -2, -10, 1, -18)
                ctx.curve_to(3, -8, 4, 2, 3, 14)
                ctx.close_path()
                ctx.set_source_rgb(0.30, 0.75, 0.22)
                ctx.fill_preserve()
                ctx.set_source_rgb(0.08, 0.25, 0.05)
                ctx.set_line_width(2)
                ctx.stroke()
            elif kind == 'leaf':
                ctx.scale(1.0, 0.55)
                ctx.arc(0, 0, 14, 0, 2 * math.pi)
                ctx.set_source_rgb(0.38, 0.70, 0.20)
                ctx.fill_preserve()
                ctx.set_source_rgb(0.08, 0.25, 0.05)
                ctx.set_line_width(2.5)
                ctx.stroke()
                ctx.move_to(-12, 0)
                ctx.line_to(12, 0)
                ctx.stroke()
            elif kind == 'pebble':
                w = rng.choice([10, 14])
                ctx.rectangle(-w / 2, -w / 2, w, w * 0.7)
                ctx.set_source_rgb(0.62, 0.64, 0.67)
                ctx.fill_preserve()
                ctx.set_source_rgb(0.1, 0.1, 0.1)
                ctx.set_line_width(2)
                ctx.stroke()
            else:
                fx.puff_cloud(ctx, 0, 0, 16, 0.9, seed=seed)
            ctx.restore()

    def slime(self, ctx, x, y, age, n=5, size=1.0, seed=0):
        """Капли слюней: блестящие голубоватые, падают и тают."""
        rng = random.Random(seed)
        for i in range(n):
            ph = rng.uniform(0, 18)
            t = ((age + ph) % 18) / 18
            px = x + rng.uniform(-90, 90) * size
            py = y + rng.uniform(-40, 30) * size + 90 * t * t * size
            r = rng.uniform(6, 11) * size * (1 - 0.4 * t)
            ctx.save()
            ctx.translate(px, py)
            ctx.scale(1, 1.35)
            ctx.arc(0, 0, r, 0, 2 * math.pi)
            ctx.restore()
            ctx.set_source_rgba(0.62, 0.88, 1.0, 0.9 * (1 - t))
            ctx.fill_preserve()
            ctx.set_source_rgba(0.2, 0.45, 0.7, 0.9 * (1 - t))
            ctx.set_line_width(2)
            ctx.stroke()

    # ================================================================ кадр
    def draw(self, ctx, f):
        ctx.save()
        self.cam.apply(ctx, f)
        ctx.set_source_surface(self.bg, -bg.M, -bg.M)
        ctx.paint()
        self.clouds.draw(ctx, f)

        fat, ball, big = self.fat(f), self.ball(f), self.big(f)
        green = (0.1, 0.35, 0.05)
        fx.shadow(ctx, fat['x'], G + 4, 470 * fat['sx'], G - fat['y'], green)
        if ball:
            fx.shadow(ctx, ball['x'], G + 4, 250 * ball['scale'] * ball['sx'], G - ball['y'], green)
        if big:
            if f < DIVE:
                fx.shadow(ctx, big['x'] + 10, G + 6, 300 * big['scale'], G - big['y'], green)
            elif f < CRASH:
                fx.shadow(ctx, big['x'] - 200, G + 6, 600, 120, green)
            else:
                fx.shadow(ctx, big['x'], G + 6, 820, 0, green)

        if 374 <= f < 392:
            fx.rays(ctx, SL, G - 160, f, r=230 + 60 * seg(f, 374, 388), alpha=seg(f, 374, 378))

        sitting = f >= CRASH              # толстый сверху на скелете
        if big and not sitting:
            self.sk.draw(ctx, big)
        swallowing = ball and (248 <= f < 268 or 316 <= f < 322)
        self.fat_r.draw(ctx, fat)
        if big and sitting:
            self.sk.draw(ctx, big)
            self.fat_r.draw(ctx, fat)
        # мусор и сам скелет видны вне тела толстого и внутри рта
        if 226 <= f < 272:
            ctx.save()
            self.fat_r.swallow_clip(ctx, fat)
            self.draw_debris(ctx, f)
            ctx.restore()
        if ball:
            ctx.save()
            if swallowing:
                self.fat_r.swallow_clip(ctx, fat)
            self.sb_r.draw(ctx, ball)
            ctx.restore()
        self.effects(ctx, f, fat, ball, big)
        ctx.restore()
        fx.flash(ctx, self.cam.flash_alpha(f))

    def effects(self, ctx, f, fat, ball, big):
        # стойка
        fx.dust(ctx, SB, G, f - 24, n=4, spread=70, size=0.5, seed=1)
        fx.dust(ctx, SB, G, f - 38, n=4, spread=70, size=0.5, seed=2)
        if ball and 70 <= f < 90:
            fx.anger(ctx, SB - 100, G - 270, f, 1.1)
        # прыжки, живот-батут
        fx.dust(ctx, 1250, G, f - 112, n=4, spread=80, size=0.6, seed=3)
        fx.dust(ctx, 1010, G, f - 128, n=4, spread=80, size=0.6, seed=4)
        fx.spark(ctx, FX + BELLY_R * 0.88, G - 150, f - 137, 0.8)
        fx.dust(ctx, SB2, G, f - 164, n=6, spread=140, seed=5)
        if ball and 168 <= f < 200:
            fx.dizzy(ctx, ball['x'], G - 330, f - 168, rx=95)
        if ball and 196 <= f < 208:
            fx.anger(ctx, ball['x'] - 95, G - 270, f, 1.2)
            fx.steam(ctx, ball['x'], G - 300, f - 196, 1.1)
        if ball and 208 <= f < 230:
            fx.dust(ctx, ball['x'] + 90, G, (f - 208) % 8, n=2, spread=50, size=0.5, seed=f // 8)
        if ball and 224 <= f < 258:
            fx.sweat(ctx, ball['x'] + 120, G - 280, f - 224, 1.1)
            fx.dust(ctx, ball['x'] + 60, G, (f - 224) % 10, n=2, spread=40, size=0.45, seed=f // 10 + 7)
        # морщится
        if 298 <= f < 310:
            fx.sweat(ctx, fat['x'] - 150, G - 400, f - 298, 1.2, side=-1)
        # плевок: слюни в полёте и на скелете
        if ball and 316 <= f < 340:
            self.slime(ctx, ball['x'], ball['y'] - BALL_R * ball['scale'], f, n=4, size=0.8, seed=f // 6)
        if ball and 340 <= f < 392:
            self.slime(ctx, ball['x'], G - 200, f - 340, n=5, size=0.9, seed=11)
        if f >= 316 and f < 344:
            fx.drool(ctx, *self.mouth_pt(316), f - 316, 1.4)
        fx.dust(ctx, SL, G, f - 340, n=6, spread=150, seed=6)
        if ball and 356 <= f < 388:
            fx.anger(ctx, ball['x'] - 95, G - 270, f, 1.2)
            fx.steam(ctx, ball['x'], G - 300, f - 356, 1.1)
        fx.smoke(ctx, SL, 640, f - 388, size=1.5, seed=5)
        if 392 <= f < 414:
            fx.sweat(ctx, fat['x'] - 150, G - 400, f - 392, 1.2, side=-1)
        # пике и промах
        fx.dust(ctx, FX2, G, f - 414, n=4, spread=90, size=0.6, seed=12)
        fx.dust(ctx, FX2, G, f - JUMP, n=4, spread=90, size=0.6, seed=13)
        fx.dust(ctx, SL, G, f - DIVE, n=6, spread=170, seed=7)
        fx.whoosh(ctx, FX2 - 40, G - 160, f - (DIVE + 14), 1.4, trail=1)
        fx.dust(ctx, 690, G, f - CRASH, n=8, spread=200, size=1.1, seed=8)
        # сел сверху
        fx.spark(ctx, CENTER, G - BACK_H, f - 464, 1.1)
        fx.dust(ctx, CENTER, G, f - 464, n=8, spread=300, size=1.2, seed=9)
        if big and f >= 470:
            head = self.sk.joint(big, 'head', (0.115, -0.60))
            fx.dizzy(ctx, head[0], head[1] - 140, f - 470, rx=100)
        # победа
        if f >= 532:
            for i, (dx, dy, ph) in enumerate(((-330, -560, 0), (300, -620, 7), (-420, -260, 13),
                                               (420, -330, 4), (-200, -700, 10), (260, -140, 16))):
                fx.twinkle(ctx, CENTER + dx, G + dy, (f - 532 + ph * 2) % 26, 0.9, dur=22)
