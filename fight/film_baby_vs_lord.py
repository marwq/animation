"""Малыш против Лорда. Луг у пруда, день. 25 с = 600 кадров.

 0–4 с      стойка по краям: малыш радостно подпрыгивает, пропеллер лениво крутится;
            лорд-шарик зло щурится и самодовольно приподнимает шляпу
 4–6 с      малыш взлетает, пролетает над лордом и срывает шляпу зубами
 6–8.5 с    лысый лорд в шоке, дважды подпрыгивает — не достаёт; малыш дразнится
 8.5–11 с   лорд злится → ухмылка, лучи → дым → большой лорд, но лысый;
            малыш пугается и отлетает; лорд щупает лысину — шок, злость
 11–12.5 с  лорд идёт к малышу и тянется схватить — мимо, «вжух»
 12.5–15.5 с малыш кружит вокруг его головы, лорд крутится следом и шатается
 15.5–18 с  малыш отлетает, разгоняет пропеллер и с разгона бьёт лорда лбом в лицо
 18–19 с    лорд падает на спину — нокаут, звёздочки
 19–25 с    малыш садится в центре, подбрасывает шляпу — она падает ему на голову;
            поворачивается к зрителю и радуется
"""
import math
import random

import bg
import fx
from anim import Camera, ball_squash, hop, lerp, pose_keys, seg, walk
from fx import ease_in, ease_io, ease_out
from rig import GROUND_Y as G, LORD_BIG, Ball, Big

BX = 440                        # малыш в стойке
LB = 1480                       # лорд-шарик в стойке
LJ = 1250                       # куда лорд допрыгал (там превращается)
LW = 1080                       # куда большой лорд дошёл
LK = 1525                       # где лорд получает удар и падает
CENTER = 960
REST = (0.0, 0.0, 0.0)
BABY_R = 150
HIT, FALL = 436, 454            # удар лбом и падение лорда
CARRY0 = (150.0, -40.0)         # шляпа относительно рта в момент, когда малыш её схватил
CARRY = (105.0, 72.0, 60.0)     # висит в зубах: сдвиг и поворот


def tremble(f, amp, seed=0):
    return random.Random(f * 31 + seed).uniform(-amp, amp)


def turn(f, t0, d0):
    """Разворот за 3 кадра: сжать по ширине, отразить, вернуть. → (dir, sx)."""
    if f < t0:
        return d0, 1.0
    return {t0: (d0, 0.55), t0 + 1: (-d0, 0.3), t0 + 2: (-d0, 0.7)}.get(f, (-d0, 1.0))


def bezier(t, p0, p1, p2):
    u = 1 - t
    return (u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0],
            u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1])


class Film:
    frames = 600

    def __init__(self):
        self.bg = bg.meadow('lake', seed=31)
        self.clouds = bg.Clouds(seed=21)
        self.baby_r = Ball('child')
        self.lb_r = Ball('lord_small')
        self.ld = Big(LORD_BIG)
        self.half = (LORD_BIG['sole'] - LORD_BIG['top']) * self.ld.k / 2
        self._cache = {}
        # кружение: малыш летает по эллипсу вокруг головы лорда, лорд разворачивается следом
        self.CIRC = (300, 370)
        self.turns = []
        d = -1
        for f in range(*self.CIRC):
            want = 1 if self.circle_pos(f)[0] > LW else -1
            if want != d and (not self.turns or f - self.turns[-1][0] >= 4):
                self.turns.append((f, d))
                d = want
        if d != -1:                                   # закончить лицом влево, к малышу
            self.turns.append((self.CIRC[1], d))
        c = self.cam = Camera()
        c.shake(132, 5, 5)
        c.shake(170, 5, 6); c.shake(190, 5, 6)
        c.flash(228, 3, 0.45); c.shake(228, 7, 10); c.punch(228, 10, 0.05, (LJ, 600))
        c.flash(HIT, 4, 0.4); c.shake(HIT, 12, 16); c.punch(HIT, 12, 0.09, self.hit_pt())
        c.shake(FALL, 20, 24); c.punch(FALL, 14, 0.07, (LK + 200, 880))
        c.shake(490, 5, 5)

    # ---------------------------------------------------------------- геометрия
    def circle_pos(self, f):
        """Центр малыша на эллипсе вокруг головы лорда; sin>0 — перед лордом."""
        t = (f - self.CIRC[0]) / 35.0          # два круга, заканчивает слева
        a = math.pi + 2 * math.pi * t
        return LW + 340 * math.cos(a), 300 + 70 * math.sin(a), math.sin(a)

    def hit_pt(self):
        """Лицо лорда в момент удара (точка касания лба малыша)."""
        return self._memo('hit', lambda: self.ld.joint(self.lord(HIT - 1), 'head', (0.21, -0.66)))

    def _memo(self, key, fn):
        if key not in self._cache:
            self._cache[key] = fn()
        return self._cache[key]

    def baby_center(self, p):
        return p['x'], p['y'] - BABY_R * p.get('scale', 1.0) * p.get('sy', 1.0)

    def mouth_pt(self, p):
        return self.baby_r.point(p, (0.05, 0.33), face=True)

    def hat_on_lord(self, p):
        c = self.lb_r.layer_center('hat')
        return self.lb_r.point(p, c)

    # ================================================================ малыш
    def baby(self, f):
        key = ('baby', f)
        if key not in self._cache:
            self._cache[key] = self._baby(f)
        return self._cache[key]

    def _baby(self, f):
        p = dict(dir=1, face_shift=0.12, eyes='normal', prop=f * 8.0, prop_blur=False)
        x, lift, sx, sy, rot = BX, 0.0, 1.0, 1.0, 0.0
        flying = False
        # стойка: два радостных подскока
        for a in (22, 36):
            if a - 3 <= f < a + 12:
                _, lift = hop(f, a, a + 8, BX, BX, 40)
                sx, sy = ball_squash(f, a, a + 8, 3, 4)
        if 60 <= f < 96:
            p['eyes'] = 'angry'
        # взлёт и кража шляпы
        if 96 <= f < 104:
            sx, sy = ball_squash(f, 104, 120, 6, 0)
            p['eyes'] = 'angry'
        elif 104 <= f < 128:
            t = seg(f, 104, 128)
            x, lift = bezier(ease_io(t), (BX, 0), (950, 620), (1330, 470))
            flying = True
        elif 128 <= f < 133:
            # пикирует к шляпе: рот точно у полей
            t = ease_in(seg(f, 128, 133))
            grab = self.grab_pose()
            x, lift = lerp(1330, grab['x'], t), lerp(470, G - grab['y'], t)
            rot = 15 * t
            flying = True
        elif 133 <= f < 152:
            t = seg(f, 133, 152)
            grab = self.grab_pose()
            x, lift = bezier(ease_out(t), (grab['x'], G - grab['y']), (1300, 640), (1000, 480))
            rot = 15 * (1 - t)
            flying = True
        elif 152 <= f < 222:
            # дразнится в воздухе: покачивается, поднимается, когда лорд прыгает
            x = 1000 + 40 * math.sin(2 * math.pi * (f - 152) / 24)
            up = sum(170 * math.sin(math.pi * seg(f, a, a + 14)) for a in (158, 180))
            lift = 480 + up + 10 * math.sin(f * 0.4)
            rot = 12 * math.sin(2 * math.pi * (f - 152) / 12)
            flying = True
        elif 222 <= f < 279:
            # большой лорд растёт — малыш в испуге отлетает
            t = ease_out(seg(f, 222, 240))
            x = lerp(1000 + 40 * math.sin(2 * math.pi * 70 / 24), 720, t)
            lift = lerp(480, 520, t) + 10 * math.sin(f * 0.4)
            flying = True
            if f < 262:
                p.update(eye_s=(1.3, 1.3))
        elif 279 <= f < 300:
            # рука лорда тянется — малыш отскакивает назад, рука хватает воздух; потом на эллипс
            cx, cy, _ = self.circle_pos(300)
            y0 = 520 + 10 * math.sin(279 * 0.4)
            if f < 290:
                x, lift = lerp(720, 450, ease_out(seg(f, 279, 287))), y0
                p['eye_s'] = (1.3, 1.3)
            else:
                x, lift = bezier(ease_io(seg(f, 290, 300)), (450, y0), (520, y0 + 120), (cx, G - cy - BABY_R))
            flying = True
        elif self.CIRC[0] <= f < self.CIRC[1]:
            cx, cy, depth = self.circle_pos(f)
            nx, _, _ = self.circle_pos(f + 1)
            x, lift = cx, G - cy - BABY_R
            p['dir'] = 1 if nx > cx else -1
            p['behind'] = depth < 0
            flying = True
        elif self.CIRC[1] <= f < HIT:
            # отлетает влево, разгоняется и таранит лицо лорда
            cx, cy, _ = self.circle_pos(self.CIRC[1])
            start = (self.hit_pt()[0] - 430, self.hit_pt()[1])
            if f < 396:
                # сначала улетает влево-вверх, подальше от шатающегося лорда
                t = ease_io(seg(f, self.CIRC[1], 396))
                x, c_y = bezier(t, (cx, cy), (620, 140), start)
                p['dir'] = -1 if f < 386 else 1
            elif f < 426:
                t = ease_out(seg(f, 396, 410))
                x, c_y = lerp(start[0], start[0] - 50, t) + tremble(f, 3) * (f >= 410), start[1]
                p.update(dir=1, eyes='angry')
                if f >= 412:
                    sx, sy = 0.9, 1.1
            else:
                t = ease_in(seg(f, 426, HIT))
                tgt = self.hit_pt()[0] - BABY_R * 0.78
                x, c_y = lerp(start[0] - 50, tgt, t), start[1]
                sx, sy = 1.15, 0.87
                p.update(dir=1, eyes='angry')
            lift = G - c_y - BABY_R
            flying = True
        elif HIT <= f < 452:
            # отскок после удара
            t = seg(f, HIT, 452)
            if f < HIT + 2:
                x, sx, sy = self.hit_pt()[0] - BABY_R * 0.78, 0.78, 1.2
            else:
                x = lerp(self.hit_pt()[0] - BABY_R * 0.78, 1000, ease_out(t))
            lift = G - self.hit_pt()[1] - BABY_R - 60 * t + 50 * math.sin(math.pi * t)
            rot = -360 * ease_out(t)
            p.update(eyes='sad')
            flying = True
        elif 452 <= f < 490:
            t = ease_io(seg(f, 462, 490))
            x = lerp(1000, CENTER, t)
            lift = lerp(G - self.hit_pt()[1] - BABY_R - 60, 0, t)
            p.update(eyes='normal' if f >= 462 else 'sad')
            flying = f < 488
        elif f >= 490:
            x = CENTER
            sx, sy = ball_squash(f, 484, 490, 0, 8)
            if f >= 524:
                p['face_shift'] = lerp(0.12, 0.0, seg(f, 524, 528))
            for a in (540, 564):
                if a - 4 <= f < a + 20:
                    _, lift = hop(f, a, a + 12, CENTER, CENTER, 60)
                    sx, sy = ball_squash(f, a, a + 12, 4, 8)
        if flying:
            p['prop'] = f * 47.0
            p['prop_blur'] = True
            if lift > 0 and not (HIT <= f < 452):
                lift += 6 * math.sin(f * 0.9)       # лёгкая вибрация от пропеллера
        if 104 <= f < 112:
            sx, sy = 0.86, 1.14
        p.update(x=x, y=G - lift, sx=sx, sy=sy, rot=rot)
        if 'behind' not in p:
            p['behind'] = False
        return p

    def grab_pose(self):
        """Где малыш, когда зубами хватает поля шляпы (кадр 133)."""
        def calc():
            lp = self.lord_ball(132)
            hc = self.hat_on_lord(lp)
            q = dict(x=0.0, y=0.0, dir=1, face_shift=0.12, rot=15.0)
            m = self.mouth_pt(q)
            # рот малыша — на левом краю полей
            target = (hc[0] - CARRY0[0], hc[1] - CARRY0[1])
            return dict(x=target[0] - m[0], y=target[1] - m[1])
        return self._memo('grab', calc)

    def hat_state(self, f):
        """Шляпа: ('lord', ...) на голове лорда, ('free', x, y, rot) — отдельно."""
        if f < 50:
            return ('lord',)
        lp = self.lord_ball(min(f, 132))
        hc = self.hat_on_lord(lp)
        if f < 72:
            # приподнял шляпу
            k = math.sin(math.pi * seg(f, 50, 72))
            return ('free', hc[0] + 10 * k, hc[1] - 45 * k, -18 * k)
        if f < 133:
            return ('lord',)
        if f < 506:
            # висит в зубах у малыша (сначала поворачивается из положения на голове)
            b = self.baby(f)
            m = self.mouth_pt(b)
            k = ease_out(seg(f, 133, 143))
            dx, dy = lerp(CARRY0[0], CARRY[0], k), lerp(CARRY0[1], CARRY[1], k)
            rot = CARRY[2] * k + 6 * math.sin(f * 0.3) * k
            return ('free', m[0] + b['dir'] * dx, m[1] + dy, b['dir'] * rot)
        b = self.baby(f)
        top = self.baby_r.point(b, (0.10, -0.36))
        if f < 528:
            # подбросил — шляпа делает сальто и садится на макушку
            t = seg(f, 506, 528)
            m = self.mouth_pt(self.baby(506))
            start = (m[0] + CARRY[0], m[1] + CARRY[1])
            x, y = bezier(t, start, (CENTER + 160, top[1] - 420), top)
            return ('free', x, y, CARRY[2] + 300 * t)
        return ('free', top[0], top[1], 0.0)

    # ================================================================ лорд-шарик
    def lord_ball(self, f):
        key = ('lb', f)
        if key not in self._cache:
            self._cache[key] = self._lord_ball(f)
        return self._cache[key]

    def _lord_ball(self, f):
        if f >= 232:
            return None
        p = dict(dir=-1, face_shift=0.12, eyes='angry', mouth='smile normal')
        x, lift, sx, sy = LB, 0.0, 1.0, 1.0
        if 50 <= f < 96:
            p['mouth'] = 'theeth smile'
        if 133 <= f < 150:
            p.update(eyes='normal', mouth='puzzlement', eye_s=(1.3, 1.3))
            x += tremble(f, 3)
        elif f >= 150:
            p.update(eyes='angry', mouth='theeth smile' if f < 200 else 'puzzlement')
        if 152 <= f < 196:
            if f < 176:
                x, lift = hop(f, 158, 172, LB, 1350, 150)
                sx, sy = ball_squash(f, 158, 172, 6, 4)
            else:
                x, lift = hop(f, 180, 194, 1350, LJ, 145)
                sx, sy = ball_squash(f, 180, 194, 4, 6)
        elif f >= 196:
            x = LJ
            sx, sy = ball_squash(f, 190, 194, 0, 8) if f < 202 else (1.0, 1.0)
            if f >= 204:
                x += tremble(f, 2)
            if f >= 214:
                p['mouth'] = 'theeth smile'
                x += tremble(f, 6, 1)
                p['scale'] = lerp(1.0, 1.1, seg(f, 214, 228))
        p.update(x=x, y=G - lift, sx=sx, sy=sy)
        if f >= 50 and not (f >= 72 and f < 133):
            p['hide'] = ('hat',)
        return p

    # ================================================================ большой лорд
    STAND = dict(x=LJ, dir=-1, hip=(0.0, 0.0), lean=0.0, head=0.0, armF=REST, armN=REST,
                 footF=(0.0, 0.0), footN=(0.0, 0.0), eyes=(1.0, 1.0), mouth=(1.0, 1.0),
                 face_shift=0.05, scale=1.0, y=G, hide=('hat',))

    def lord(self, f):
        key = ('ld', f)
        if key not in self._cache:
            self._cache[key] = self._lord(f)
        return self._cache[key]

    def _lord(self, f):
        if f < 230:
            return None
        ld = self.ld
        keys = [
            (230, dict(self.STAND, scale=0.55), 'lin'),
            (234, dict(scale=1.1)), (237, dict(scale=0.96)), (240, dict(scale=1.0)),
            (244, dict(eyes=(1.0, 0.55))),
            (256, dict(eyes=(1.35, 1.35))),          # лысый!
            (262, dict(eyes=(1.0, 0.5))),
        ]
        p = pose_keys(f, keys)
        # щупает лысину
        if 244 <= f < 266:
            top = ld.joint(dict(p, armN=REST), 'head', (-0.02, -0.90))
            pat = ld.arm_ik(dict(p, armN=REST), 'N', (top[0], top[1] - 8 * math.sin(f * 1.2) * (f < 258)),
                            tip=(-0.235, 0.40), bend=-1)
            p['armN'] = lerp(REST, pat, ease_io(min(seg(f, 244, 250), 1 - seg(f, 260, 266))))
        w = walk(f, 266, LJ, LW, 2, 9, ld, -1)
        if w:
            p.update(w)
        elif f >= 266:
            p['x'] = LW
        # тянется схватить малыша — мимо
        if 280 <= f < 300:
            b = self.baby(278)
            reach = ld.arm_ik(dict(p, armF=REST, x=LW), 'F', self.baby_center(b), tip=(0.225, 0.33))
            if f < 288:
                p['armF'] = lerp(REST, reach, ease_out(seg(f, 280, 288)))
                p['lean'] = 6.0 * seg(f, 280, 288)
            elif f < 292:
                p['armF'] = reach
                p['lean'] = 6.0
            else:
                p['armF'] = lerp(reach, REST, ease_io(seg(f, 292, 298)))
                p['lean'] = lerp(6.0, 0.0, seg(f, 292, 298))
        # кружится следом за малышом
        d, sx = -1, 1.0
        for t0, d0 in self.turns:
            if f >= t0:
                d, sx = turn(f, t0, d0)
        p['dir'], p['sx'] = d, sx
        if self.CIRC[0] <= f < 404:
            p['eyes'] = (1.0, 0.5) if f < self.CIRC[1] else (1.2, 0.45)
            p['head'] = 6 * math.sin(f * 0.5)
        # шатается, пятится назад
        if self.CIRC[1] <= f < HIT:
            w = walk(f, 374, LW, LK, 3, 9, ld, -1, lift=0.05)
            sway = 9 * math.sin(2 * math.pi * (f - 370) / 22)
            if w:
                p.update({k: v for k, v in w.items() if not k.startswith('arm')})
            elif f >= 374:
                p['x'] = LK
            p['lean'] = sway
            p['armF'], p['armN'] = (20 + sway, 15.0, 0.0), (-15 - sway, 15.0, 0.0)
        # удар в лицо — голова назад, падение на спину
        if f >= HIT:
            p.update(x=LK, eyes=(1.4, 1.4), head=-22.0, armF=(-40.0, 20.0, 0.0), armN=(40.0, 20.0, 0.0),
                     footF=(0.0, 0.0), footN=(0.0, 0.0), hip=(0.0, 0.0), lean=0.0)
        if HIT <= f < FALL:
            t = ease_in(seg(f, HIT + 2, FALL))
            ang = -90.0 * t
            p['rot'] = ang
            cy = lerp(G - self.half, G - 115, t)
            p['y'] = cy + self.half
            p['footF'] = (0.0, -0.08 * t)
        elif f >= FALL:
            # лежит на спине, колени согнуты вверх (вперёд по носкам)
            p.update(rot=-90.0, eyes=(1.0, 0.12), head=-10.0, armF=(-8.0, 6.0, 0.0), armN=(8.0, 6.0, 0.0),
                     footF=(0.10, -0.22), footN=(0.06, -0.20))
            bounce = 18 * math.sin(math.pi * seg(f, FALL, FALL + 6))
            p['y'] = G - 115 - bounce + self.half
            if f >= 480 and (f - 480) % 28 < 4:
                p['footN'] = (0.06, -0.25)      # подёргивается
        return p

    # ================================================================ кадр
    def draw(self, ctx, f):
        ctx.save()
        self.cam.apply(ctx, f)
        ctx.set_source_surface(self.bg, -bg.M, -bg.M)
        ctx.paint()
        self.clouds.draw(ctx, f)

        baby, lb, ld = self.baby(f), self.lord_ball(f), self.lord(f)
        green = (0.1, 0.35, 0.05)
        fx.shadow(ctx, baby['x'], G + 4, 240 * baby['sx'], G - baby['y'], green)
        if lb:
            fx.shadow(ctx, lb['x'], G + 4, 250 * lb.get('scale', 1.0) * lb['sx'], G - lb['y'], green)
        if ld:
            if f < FALL:
                fx.shadow(ctx, ld['x'], G + 6, 290, 0, green)
            else:
                fx.shadow(ctx, ld['x'], G + 6, 820, 0, green)

        if 214 <= f < 232:
            fx.rays(ctx, LJ, G - 160, f, r=230 + 60 * seg(f, 214, 228), alpha=seg(f, 214, 218))

        hat = self.hat_state(f)
        if baby['behind']:
            self.draw_baby(ctx, baby, hat)
        if lb:
            self.lb_r.draw(ctx, lb)
        if ld:
            self.ld.draw(ctx, ld)
        if not baby['behind']:
            self.draw_baby(ctx, baby, hat)
        self.effects(ctx, f, baby, lb, ld)
        ctx.restore()
        fx.flash(ctx, self.cam.flash_alpha(f))

    def draw_baby(self, ctx, baby, hat):
        self.baby_r.draw(ctx, baby)
        if hat[0] == 'free':
            self.lb_r.draw_layer_at(ctx, 'hat', hat[1], hat[2], hat[3], d=-1)

    def effects(self, ctx, f, baby, lb, ld):
        # стойка
        fx.dust(ctx, BX, G, f - 30, n=4, spread=60, size=0.5, seed=1)
        fx.dust(ctx, BX, G, f - 44, n=4, spread=60, size=0.5, seed=2)
        fx.dust(ctx, BX, G, f - 104, n=6, spread=120, size=0.8, seed=3)
        # шляпу сорвали
        if lb and 133 <= f < 150:
            fx.sweat(ctx, lb['x'] - 120, G - 270, f - 133, 1.1, side=-1)
        fx.whoosh(ctx, 1300, 330, f - 136, 1.0, trail=1)
        fx.dust(ctx, 1350, G, f - 172, n=4, spread=80, size=0.6, seed=4)
        fx.dust(ctx, LJ, G, f - 194, n=4, spread=80, size=0.6, seed=5)
        if lb and 196 <= f < 228:
            fx.anger(ctx, lb['x'] - 95, G - 270, f, 1.2)
            fx.steam(ctx, lb['x'], G - 300, f - 196, 1.1)
        fx.smoke(ctx, LJ, 640, f - 228, size=1.5, seed=5)
        if 236 <= f < 262:
            bc = self.baby_center(baby)
            fx.sweat(ctx, bc[0] + 130, bc[1] - 120, f - 236, 1.1)
        # лысина: блик-звёздочка
        if ld and 252 <= f < 262:
            top = self.ld.joint(ld, 'head', (0.05, -0.90))
            fx.twinkle(ctx, top[0], top[1] - 10, f - 252, 0.7, dur=10)
        if ld and 262 <= f < 282:
            top = self.ld.joint(ld, 'head', (0.0, -0.88))
            fx.anger(ctx, top[0] + 60, top[1] + 60, f, 1.3)
            fx.steam(ctx, top[0], top[1] + 20, f - 262, 1.2)
        # мимо — «вжух»
        hand = self.ld.joint(self.lord(288), 'F3', (0.225, 0.33))
        fx.whoosh(ctx, hand[0], hand[1], f - 288, 1.3, trail=-1)
        # головокружение
        if ld and self.CIRC[1] - 10 <= f < HIT:
            top = self.ld.joint(ld, 'head', (0.0, -0.9))
            fx.dizzy(ctx, top[0], top[1] - 20, f, rx=100)
        # удар лбом
        hx, hy = self.hit_pt()
        fx.spark(ctx, hx, hy, f - HIT, 1.2)
        fx.dust(ctx, LK + 150, G, f - FALL, n=8, spread=300, size=1.2, seed=6)
        if ld and f >= FALL + 2:
            head = self.ld.joint(ld, 'head', (0.0, -0.66))
            fx.dizzy(ctx, head[0], head[1] - 150, f - FALL, rx=100)
        if 446 <= f < 470:
            bc = self.baby_center(baby)
            fx.dizzy(ctx, bc[0], bc[1] - 230, f - 446, rx=70, n=3, size=0.8)
        fx.dust(ctx, CENTER, G, f - 490, n=5, spread=110, size=0.7, seed=7)
        # победа
        if f >= 530:
            for i, (dx, dy, ph) in enumerate(((-330, -460, 0), (300, -520, 7), (-420, -220, 13),
                                               (380, -300, 4), (-200, -600, 10), (220, -120, 16))):
                fx.twinkle(ctx, CENTER + dx, G + dy, (f - 530 + ph * 2) % 26, 0.9, dur=22)
