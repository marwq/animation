"""Скелет против Лорда. Пустынный каньон, день. 25 с = 600 кадров.

 0–4 с    стойка: шарики стоят неподвижно друг напротив друга (место под 3‑2‑1)
 4–8 с    два прыжка навстречу, столкновение лбами; скелет отлетает кувырком,
          над головой звёздочки, лорд смеётся
 8–12 с   скелет злится → ухмылка, лучи → дым → крылатый скелет;
          лорд пугается, злится и тоже превращается
 12–16 с  лорд снимает шляпу и бросает её как фрисби; скелет ныряет вниз,
          шляпа пролетает над ним, разворачивается бумерангом и бьёт его
          по затылку, а потом возвращается лорду на голову
 16–20 с  скелет злится, летит низко к лорду; лорд бьёт сверху — скелет
          ныряет под удар («вжух») и снизу апперкотом попадает лорду в подбородок
 20–21 с  лорд с вращением улетает за кадр, на месте исчезновения блеск
 21–25 с  скелет выходит в центр, руки и крылья вверх, вокруг блеск
"""
import math
import random

import bg
import fx
from anim import Camera, ball_squash, hop, lerp, pose_keys, seg, walk
from fx import ease_in, ease_io, ease_out
from rig import GROUND_Y as G, LORD_BIG, SKELETON_BIG, Ball, Big

SB_X, LB_X = 560, 1360          # шарики в стойке
SKX, LDX = 470, 1250            # где стоят большие
SKX2, SKX3 = 760, 960           # куда прилетает скелет, центр кадра
LUNGE = 100                     # выпад лорда вперёд при шлепке

HAND_TIP_SK = (0.238, 0.587)    # кончики когтей скелета (кисть F)
PALM_LD = (0.225, 0.31)         # ладонь лорда (кисть F)
BRIM_LD = (0.29, -0.80)         # передний край полей шляпы лорда


def tremble(f, amp, seed=0):
    r = random.Random(f * 31 + seed)
    return r.uniform(-amp, amp)


def path(f, pts):
    """Плавная кривая Катмулла–Рома через точки [(кадр, (x, y)), ...]."""
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
        self.bg = bg.desert(seed=7)
        self.clouds = bg.Clouds(seed=3)
        self.sk = Big(SKELETON_BIG)
        self.ld = Big(LORD_BIG)
        self.sb = Ball('skeleton_small')
        self.lb = Ball('lord_small')
        c = self.cam = Camera()
        c.shake(135, 12, 12); c.punch(135, 12, 0.06, (960, 770)); c.flash(135, 4, 0.25)
        c.shake(162, 6, 6)
        c.flash(230, 3, 0.45); c.shake(230, 7, 10); c.punch(230, 10, 0.05, (470, 600))
        c.flash(276, 3, 0.45); c.shake(276, 7, 10); c.punch(276, 10, 0.05, (1250, 600))
        c.shake(368, 8, 9); c.punch(368, 10, 0.06, (410, 240))
        c.shake(432, 5, 5)
        c.flash(458, 4, 0.45); c.shake(458, 22, 26)
        self._hat_path = None
        self.chin = self.ld.joint(self.lord(458), 'head', (0.03, -0.40))
        c.punch(458, 16, 0.12, self.chin)

    # ================================================================ шарики
    def skel_ball(self, f):
        if f >= 240:
            return None
        p = dict(x=SB_X, dir=1, eyes='angry', mouth='smile normal')
        sx = sy = 1.0
        lift = rot = 0.0
        x = SB_X
        if 96 <= f < 116:
            x, lift = hop(f, 100, 112, SB_X, 690, 80)
            sx, sy = ball_squash(f, 100, 112, 4, 4)
        elif 116 <= f < 131:
            x, lift = hop(f, 116, 128, 690, 800, 60)
            sx, sy = ball_squash(f, 116, 128, 4, 3)
        elif 131 <= f < 138:
            t = seg(f, 131, 135)
            x = lerp(800, 846, ease_in(t))
            lift = 26 * math.sin(math.pi * t)
            sx, sy = lerp(1.0, 0.76, ease_in(t)), lerp(1.0, 1.2, ease_in(t))
        elif 138 <= f < 162:
            t = seg(f, 138, 162)
            x = lerp(846, SKX, ease_out(t))
            lift = 300 * 4 * t * (1 - t)
            rot = -720 * ease_out(t)
            sx, sy = (0.9, 1.1) if t < 0.3 else (1.0, 1.0)
        elif 162 <= f < 182:
            x = SKX
            if f < 164:
                sx, sy = 1.35, 0.65
            elif f < 172:
                t = seg(f, 164, 172)
                lift = 45 * 4 * t * (1 - t)
                sx, sy = lerp(0.92, 1.0, t), lerp(1.08, 1.0, t)
            else:
                t = seg(f, 172, 180)
                sx, sy = lerp(1.14, 1.0, ease_out(t)), lerp(0.86, 1.0, ease_out(t))
        elif f >= 182:
            x = SKX
        if f >= 138:
            p.update(eyes='sad', mouth='puzzlement')
        if f >= 196:
            p.update(eyes='angry', mouth='puzzlement')
            x += tremble(f, 2)
        if f >= 216:
            p.update(mouth='theeth smile')
            x += tremble(f, 6, 1)
            p['scale'] = lerp(1.0, 1.1, seg(f, 216, 230))
        p.update(x=x, y=G - lift, sx=sx, sy=sy, rot=rot)
        return p

    def lord_ball(self, f):
        if f >= 286:
            return None
        p = dict(x=LB_X, dir=-1, eyes='angry', mouth='theeth smile')
        sx = sy = 1.0
        lift = 0.0
        x = LB_X
        if 96 <= f < 116:
            x, lift = hop(f, 100, 112, LB_X, 1230, 80)
            sx, sy = ball_squash(f, 100, 112, 4, 4)
        elif 116 <= f < 131:
            x, lift = hop(f, 116, 128, 1230, 1120, 60)
            sx, sy = ball_squash(f, 116, 128, 4, 3)
        elif 131 <= f < 138:
            t = seg(f, 131, 135)
            x = lerp(1120, 1074, ease_in(t))
            lift = 26 * math.sin(math.pi * t)
            sx, sy = lerp(1.0, 0.76, ease_in(t)), lerp(1.0, 1.2, ease_in(t))
        elif 138 <= f < 160:
            x, lift = hop(f, 139, 150, 1074, LDX, 50)
            sx, sy = ball_squash(f, 139, 150, 1, 8)
        elif f >= 160:
            x = LDX
        if 138 <= f < 156:
            p.update(eyes='normal', mouth='puzzlement')
        elif 156 <= f < 196:
            # смех: пульсирует
            p.update(eyes='normal', mouth='happy')
            ph = ((f - 156) // 4) % 2
            sx, sy = (1.05, 0.95) if ph == 0 else (0.97, 1.03)
        elif 196 <= f < 246:
            p.update(eyes='normal', mouth='theeth smile')
        elif 246 <= f < 266:
            p.update(eyes='normal', mouth='puzzlement', eye_s=(1.3, 1.3))
            x += tremble(f, 3)
        elif f >= 266:
            p.update(eyes='angry', mouth='theeth smile')
            x += tremble(f, 4)
            p['scale'] = lerp(1.0, 1.08, seg(f, 266, 276))
        p.update(x=x, y=G - lift, sx=sx, sy=sy)
        return p

    # ================================================================ большой скелет
    STAND_S = dict(x=SKX, dir=1, wings=20.0, hip=(0.0, 0.0), lean=0.0, head=0.0,
                   armF=(0.0, 0.0, 0.0), armN=(0.0, 0.0, 0.0), footF=(0.0, 0.0), footN=(0.0, 0.0),
                   eyes=(1.0, 1.0), mouth=(1.0, 1.0), face_shift=0.035, scale=1.0, y=G)

    def skel(self, f):
        if f < 240:
            return None
        S = self.STAND_S
        DUCK1 = dict(hip=(0.0, 0.38), lean=8.0, head=6.0, wings=-30.0, armF=(25.0, 35.0, 0.0), armN=(-10.0, 35.0, 0.0))
        UP = dict(hip=(0.0, 0.0), lean=0.0, head=0.0, wings=20.0, armF=(0.0, 0.0, 0.0), armN=(0.0, 0.0, 0.0))
        keys = [
            (240, dict(S, scale=0.55), 'lin'),
            (244, dict(scale=1.1)),
            (247, dict(scale=0.96)),
            (250, dict(scale=1.0)),
            # шляпа летит — нырок вниз
            (336, {}), (342, DUCK1), (350, {}), (358, UP),
            # удар шляпой по затылку
            (368, {}, 'out'),
            (372, dict(lean=22.0, head=18.0, hip=(0.03, 0.04), eyes=(1.35, 1.35),
                       armF=(-30.0, 25.0, 0.0), armN=(35.0, 25.0, 0.0), wings=-10.0)),
            (382, dict(lean=6.0, head=6.0, hip=(0.0, 0.0), eyes=(1.0, 0.6), armF=(0.0, 5.0, 0.0), armN=(0.0, 5.0, 0.0), wings=10.0)),
            (390, dict(UP, eyes=(1.0, 0.6))),
            # злость, подготовка к взлёту
            (402, {}), (408, dict(hip=(0.0, 0.10), lean=10.0, wings=35.0, eyes=(1.0, 0.55))),
            (410, {}),
        ]
        p = pose_keys(f, keys)
        if 410 <= f < 432:
            # низкий полёт к лорду, крылья машут
            t = seg(f, 410, 432)
            p.update(x=lerp(SKX, SKX2, ease_io(t)), y=G - 75 * math.sin(math.pi * t),
                     hip=(0.0, 0.0), lean=14.0, head=-4.0,
                     wings=12 + 38 * math.sin(2 * math.pi * (f - 410) / 6),
                     footF=(-0.04, -0.03), footN=(-0.07, -0.02),
                     armF=(-25.0, 15.0, 0.0), armN=(-30.0, 15.0, 0.0))
        elif f >= 432:
            p.update(x=SKX2, y=G)
            keys2 = [
                (432, dict(hip=(0.0, 0.10), lean=6.0, head=0.0, wings=-20.0, footF=(0.0, 0.0), footN=(0.0, 0.0),
                           armF=(0.0, 10.0, 0.0), armN=(0.0, 10.0, 0.0), eyes=(1.0, 0.55))),
                (436, dict(hip=(0.0, 0.0), lean=0.0, wings=-30.0)),
                # нырок под шлепок
                (437, {}),
                (442, dict(hip=(0.0, 0.40), lean=8.0, head=4.0, wings=-40.0, armF=(-35.0, 105.0, 0.0), armN=(-15.0, 40.0, 0.0))),
                (452, {}, 'in'),
                (458, dict(hip=(0.0, -0.02), lean=-6.0, head=-6.0, wings=5.0, armN=(-35.0, 20.0, 0.0), eyes=(1.0, 1.0))),
                (476, {}),
                (492, dict(UP)),
            ]
            p.update(pose_keys(f, keys2))
            if 442 <= f < 452:
                p['x'] = SKX2 + tremble(f, 2)
            if 452 <= f < 492:
                # апперкот: кулак точно в подбородок лорда на кадре 458
                lp = self.lord(min(f, 458))
                chin = self.ld.joint(lp, 'head', (0.03, -0.40))
                hit = self.sk.arm_ik(dict(p), 'F', chin, tip=HAND_TIP_SK, wrist=-10.0)
                coil = (-35.0, 105.0, 0.0)
                if f < 458:
                    p['armF'] = lerp(coil, hit, ease_in(seg(f, 452, 458)))
                elif f < 476:
                    p['armF'] = hit
                else:
                    p['armF'] = lerp(hit, (0.0, 0.0, 0.0), ease_io(seg(f, 476, 492)))
            w = walk(f, 503, SKX2, SKX3, 3, 10, self.sk, 1)
            if w:
                p.update(w)
            elif f >= 505:
                p['x'] = SKX3
            # к зрителю и победа
            if f >= 539:
                p['face_shift'] = lerp(0.035, -0.03, seg(f, 539, 543))
                p['head'] = 0.0
            if f >= 543:
                # руки вверх буквой V, крылья вверх; дважды «качает» кулаками
                t = ease_io(seg(f, 543, 551))
                pump = sum(math.sin(math.pi * seg(f, a, a + 10)) for a in (562, 580))
                p['armF'] = lerp((0.0, 0.0, 0.0), (136.0 + 10 * pump, 15.0, 0.0), t)
                p['armN'] = lerp((0.0, 0.0, 0.0), (-136.0 - 10 * pump, -15.0, 0.0), t)
                p['wings'] = lerp(20.0, 6.0, t) + 10 * pump
        return p

    # ================================================================ большой лорд
    STAND_L = dict(x=LDX, dir=-1, hip=(0.0, 0.0), lean=0.0, head=0.0, armF=(0.0, 0.0, 0.0),
                   armN=(0.0, 0.0, 0.0), footF=(0.0, 0.0), footN=(0.0, 0.0), eyes=(1.0, 1.0),
                   mouth=(1.0, 1.0), face_shift=0.05, scale=1.0, y=G)

    def lord(self, f):
        if f < 286:
            return None
        S = self.STAND_L
        keys = [
            (286, dict(S, scale=0.55), 'lin'),
            (290, dict(scale=1.1)),
            (293, dict(scale=0.96)),
            (296, dict(scale=1.0)),
            (316, {}),
            (326, dict(lean=-8.0)),
            (332, {}, 'in'),
            (336, dict(lean=12.0)),
            (350, {}),
            (360, dict(lean=0.0)),
            # смеётся, пока шляпа летит обратно
            (370, {}), (374, dict(head=-8.0, lean=-5.0, eyes=(1.0, 0.55))),
            (388, {}), (391, dict(head=0.0, lean=0.0, eyes=(1.0, 1.0))),
            # скелет летит на него
            (416, {}), (420, dict(eyes=(1.3, 1.3))),
            (430, {}), (434, dict(eyes=(1.0, 0.6))),
            # замах сверху и шлепок
            (434, {}), (439, dict(lean=-6.0, armF=(150.0, 20.0, 0.0))),
            (441, {}, 'in'), (444, dict(lean=10.0, head=4.0, armF=(145.0, 5.0, 0.0), hip=(0.0, 0.03))),
            (448, dict(eyes=(1.3, 1.3))),
            (458, {}, 'out'), (461, dict(head=-25.0, lean=-6.0, eyes=(1.35, 1.35))),
        ]
        p = pose_keys(f, keys)
        # рука к шляпе, замах назад, бросок
        if 300 <= f < 350:
            q = dict(p)
            brim = self.ld.joint(dict(q, armF=(0.0, 0.0, 0.0)), 'head', BRIM_LD)
            grab = self.ld.arm_ik(q, 'F', brim, tip=PALM_LD)
            back = self.ld.arm_ik(q, 'F', self.ld.joint(q, 'head', (-0.33, -0.74)), tip=PALM_LD, bend=1)
            if back[0] < 0:
                back = (back[0] + 360.0,) + back[1:]   # замах через верх, а не снизу
            throw = (115.0, 0.0, 0.0)
            if f < 308:
                p['armF'] = lerp((0.0, 0.0, 0.0), grab, ease_io(seg(f, 300, 308)))
            elif f < 316:
                p['armF'] = grab
            elif f < 326:
                p['armF'] = lerp(grab, back, ease_io(seg(f, 316, 326)))
            elif f < 332:
                p['armF'] = back
            elif f < 336:
                p['armF'] = lerp(back, throw, ease_in(seg(f, 332, 336)))
            else:
                p['armF'] = throw
        elif 350 <= f < 360:
            p["armF"] = lerp((115.0, 0.0, 0.0), (0.0, 0.0, 0.0), ease_io(seg(f, 350, 360)))
        if 374 <= f < 388:
            # смех: подпрыгивает плечами
            p['hip'] = (0.0, 0.018 * (((f - 374) // 3) % 2))
        if 316 <= f < 392:
            p['hide'] = ('hat',)
        if f >= 441:
            # выпад: передняя нога шагает вперёд, задняя стоит на месте
            t = ease_in(seg(f, 441, 444))
            k = self.ld.k
            X = LDX - LUNGE * t
            front = LDX - (LUNGE + 40) * t
            p['x'] = X
            p['footF'] = ((front - X) / (-k), -0.05 * math.sin(math.pi * t))
            p['footN'] = ((LDX - X) / (-k), 0.0)
        # улёт после апперкота
        if f >= 462:
            t = seg(f, 462, 494)
            p.update(x=LDX - LUNGE + 820 * t, y=G - 1350 * t + 250 * t * t, rot=-1080 * ease_in(t) * 0.5 - 540 * t,
                     armF=(140.0, 20.0, 0.0), armN=(-140.0, -20.0, 0.0), footF=(0.08, -0.05), footN=(-0.08, -0.08))
        return p

    # ================================================================ шляпа лорда
    def hat_in_hand(self, f):
        lp = self.lord(f)
        palm = self.ld.joint(lp, 'F3', PALM_LD)
        k = self.ld.k
        # от ладони (край полей) до центра шляпы
        return palm[0] + lp['dir'] * k * (-0.29), palm[1] + k * (-0.05)

    def hat_on_head(self, f):
        return self.ld.joint(self.lord(f), 'head', self.ld.P('hat'))

    def hat(self, f):
        """(x, y, поворот, слой) — где шляпа, когда она не на голове."""
        if f < 316 or f >= 392:
            return None
        if f < 336:
            # в руке: на замахе за головой, на броске — поверх
            x, y = self.hat_in_hand(f)
            return x, y, 0.0, 'back' if f < 332 else 'front'
        if self._hat_path is None:
            sp = self.skel(368)
            skull = self.sk.joint(sp, 'head', (-0.085, -0.60))
            k = self.ld.k
            hit = (skull[0] - 0.297 * k, skull[1] - 0.045 * k)
            self._hit_pt = skull
            self._hat_path = [
                (336, self.hat_in_hand(336)), (341, (720, 228)), (345, (520, 200)),
                (349, (320, 186)), (354, (175, 210)), (358, (150, 262)), (362, (190, 262)),
                (368, hit),
            ]
            self._hat_back = [
                (368, hit), (372, (420, 160)), (379, (700, 112)), (385, (980, 116)),
                (389, (1170, 158)), (392, self.hat_on_head(392)),
            ]
        if f < 368:
            x, y = path(f, self._hat_path)
            rot = -720 * seg(f, 336, 368)
        else:
            x, y = path(f, self._hat_back)
            rot = 360 * ease_out(seg(f, 368, 392))
        return x, y, rot, 'front'

    # ================================================================ кадр
    def draw(self, ctx, f):
        ctx.save()
        self.cam.apply(ctx, f)
        ctx.set_source_surface(self.bg, -bg.M, -bg.M)
        ctx.paint()
        self.clouds.draw(ctx, f)

        sb, lb, sk, ld = self.skel_ball(f), self.lord_ball(f), self.skel(f), self.lord(f)
        hat = self.hat(f)

        # тени
        for p, w in ((sb, 250), (lb, 250)):
            if p:
                fx.shadow(ctx, p['x'], G + 4, w * p.get('scale', 1.0), G - p['y'])
        if sk:
            fx.shadow(ctx, sk['x'] + 10, G + 6, 300 * sk['scale'], G - sk['y'])
        if ld and f < 494:
            fx.shadow(ctx, ld['x'] - 10, G + 6, 290 * ld['scale'], G - ld['y'])

        # за персонажами: золотые лучи
        if 216 <= f < 236:
            fx.rays(ctx, SKX, G - 160, f, r=230 + 60 * seg(f, 216, 230), alpha=seg(f, 216, 220))

        # персонажи
        if sb:
            self.sb.draw(ctx, sb)
        if lb:
            self.lb.draw(ctx, lb)
        if hat and hat[3] == 'back':
            self.ld.draw_hat(ctx, hat[0], hat[1], hat[2], -1)
        if f < 437:
            if sk:
                self.sk.draw(ctx, sk)
            if ld:
                self.ld.draw(ctx, ld)
        else:
            # кулак скелета должен быть перед лордом, а крылья — за ним
            wings = ('wing 1', 'wing 2')
            self.sk.draw(ctx, dict(sk, only=wings))
            if ld and f < 494:
                self.ld.draw(ctx, ld)
            self.sk.draw(ctx, dict(sk, hide=wings))
        if hat and hat[3] == 'front':
            self.ld.draw_hat(ctx, hat[0], hat[1], hat[2], -1)

        self.effects(ctx, f, sb, lb, sk, ld)
        ctx.restore()
        fx.flash(ctx, self.cam.flash_alpha(f))

    def effects(self, ctx, f, sb, lb, sk, ld):
        # столкновение лбами
        fx.spark(ctx, 960, G - 180, f - 135, 1.0)
        fx.dust(ctx, SKX, G, f - 162, n=6, spread=150, seed=1)
        fx.dust(ctx, 690, G, f - 112, n=4, spread=80, size=0.6, seed=2)
        fx.dust(ctx, 1230, G, f - 112, n=4, spread=80, size=0.6, seed=3)
        fx.dust(ctx, LDX, G, f - 150, n=4, spread=90, size=0.7, seed=4)
        if sb and 166 <= f < 200:
            fx.dizzy(ctx, sb['x'], G - 330, f - 166, rx=95)
        if sb and 196 <= f < 230:
            fx.anger(ctx, sb['x'] + 95, G - 270, f, 1.2)
            fx.steam(ctx, sb['x'], G - 300, f - 196, 1.1)
        # превращение скелета
        fx.smoke(ctx, SKX, 640, f - 230, size=1.5, seed=5)
        # лорд-шарик пугается и злится
        if lb and 246 <= f < 266:
            fx.sweat(ctx, lb['x'] - 120, G - 270, f - 246, 1.2, side=-1)
        if lb and 266 <= f < 280:
            fx.anger(ctx, lb['x'] - 95, G - 270, f, 1.2)
        fx.smoke(ctx, LDX, 640, f - 276, size=1.5, seed=9)
        # шляпа пролетает над нырнувшим скелетом
        fx.whoosh(ctx, 470, 205, f - 345, 1.3, trail=1)
        # шляпа бьёт по затылку
        if f >= 368 and self._hat_path is not None:
            hx, hy = self._hit_pt
            fx.spark(ctx, hx, hy, f - 368, 0.75)
        if sk and 372 <= f < 404:
            top = self.sk.joint(sk, 'head', (0.115, -0.86))
            fx.dizzy(ctx, top[0], top[1] - 10, f - 372, rx=110)
        if sk and 398 <= f < 412:
            top = self.sk.joint(sk, 'head', (0.115, -0.86))
            fx.anger(ctx, top[0] + 90, top[1] + 40, f, 1.3)
            fx.steam(ctx, top[0], top[1] + 20, f - 398, 1.2)
        # взлёт и посадка
        fx.dust(ctx, SKX, G, f - 410, n=6, spread=170, seed=6)
        fx.dust(ctx, SKX2, G, f - 432, n=6, spread=150, seed=7)
        # лорд пугается, видя летящего скелета
        if ld and 418 <= f < 434:
            top = self.ld.joint(ld, 'head', (0.0, -0.98))
            fx.sweat(ctx, top[0] - 120, top[1] + 80, f - 418, 1.3, side=-1)
        # шлепок мимо
        fx.whoosh(ctx, 880, 215, f - 443, 1.4, trail=1)
        # апперкот
        fx.spark(ctx, self.chin[0], self.chin[1], f - 458, 1.25)
        # улёт — блеск там, где лорд исчез
        fx.twinkle(ctx, 1830, 70, f - 486, 1.4, dur=22)
        # победа: блеск вокруг
        if f >= 544:
            for i, (dx, dy, ph) in enumerate(((-330, -620, 0), (300, -700, 7), (-420, -300, 13),
                                               (420, -380, 4), (-200, -820, 10), (240, -150, 16))):
                fx.twinkle(ctx, SKX3 + dx, G + dy, (f - 544 + ph * 2) % 26, 0.9, dur=22)
