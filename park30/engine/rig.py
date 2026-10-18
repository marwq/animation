"""Скелет персонажа: палочные руки и ноги, большая круглая голова.

Единица длины u — диаметр головы. Персонаж рисуется в локальных координатах:
x вперёд по взгляду, y вниз, (0, 0) — точка на земле под тазом. Масштаб s — пикселей
на u, f = +1 смотрит вправо, -1 влево.

Ноги ставятся по IK: задаётся точка стопы, колено находится само и всегда сгибается
вперёд. Руки — по углам (FK) или тоже по IK, если задана точка кисти.
"""
import math
import cairo
from .core import hexrgb, shade, mix, clamp, lerp, noise1, TAU
from . import draw as D

THIGH, SHIN = 0.84, 0.84
UARM, FARM = 0.60, 0.56
TORSO = 1.06
NECK = 0.17
HIP_H = THIGH + SHIN - 0.02
LIMB_W = 0.105
OUT_W = 0.05


class Look:
    def __init__(self, **kw):
        self.head = hexrgb("#f4efe4")
        self.head_shade = None
        self.body = hexrgb("#34466b")
        self.body2 = None            # второй цвет (полосы, фартук)
        self.limb = D.INK
        self.style = "shirt"         # shirt / coat / dress / jacket / tee
        self.length = 0.0            # удлинение одежды вниз (u)
        self.hat = None
        self.hat_col = hexrgb("#e2a33b")
        self.hair = None
        self.hair_col = hexrgb("#3a2a24")
        self.zombie = False
        self.details = ()
        self.scale = 1.0             # рост (дети меньше)
        self.head_scale = 1.0
        self.name = ""
        self.seed = 0
        self.eye_size = 1.0
        self.girth = 1.0             # полнота: >1 живот, <1 худоба
        self.limb_k = 1.0            # толщина рук и ног
        self.torso_line = True       # обводка туловища и тень только на спине
        self.fur = None              # костюм-маскот: цвет меха рук и ног (с обводкой), перчатки, лапы-ботинки
        self.mascot_head = None      # "raccoon" — голова ростовой куклы вместо лица
        self.tail = None             # "raccoon" — полосатый хвост
        self.neck_len = None         # длина шеи (None — обычная)
        for k, v in kw.items():
            if isinstance(v, str) and v.startswith("#"):
                v = hexrgb(v)
            setattr(self, k, v)
        if self.head_shade is None:
            self.head_shade = shade(self.head, -0.13)


# --- базовые позы ------------------------------------------------------------

def stand(view="side", t=0.0, seed=0):
    """Стойка с лёгким дыханием и покачиванием рук."""
    br = math.sin(t * TAU / 3.6 + seed) * 0.012
    sw = noise1(t * 0.35, seed + 5) * 0.05
    p = dict(view=view, hip=(0.0, br), lean=0.02 + br * 0.5, neck=0.0, hturn=1.0 if view == "side" else 0.0)
    if view == "side":
        p.update(f1=(0.07, 0.0), f2=(-0.07, 0.0), a1=(0.06 + sw, 0.14), a2=(-0.04 - sw, 0.12))
    else:
        p.update(f1=(-0.16, 0.0), f2=(0.16, 0.0), a1=(0.10 + sw * 0.5, -0.06), a2=(0.10 - sw * 0.5, -0.06))
    p["blink"] = blink(t, seed)
    return p


def blink(t, seed=0):
    """Моргание раз в 3–5 секунд."""
    period = 3.4 + (seed % 7) * 0.25
    ph = (t + seed * 0.77) % period
    return 1.0 if ph < 0.11 else 0.0


def gait(phase, kind="walk", view="side", seed=0):
    """Поза цикла шага. phase — пройденное расстояние / длину цикла.

    walk: обычная ходьба; run: бег с фазой полёта; sneak: на цыпочках;
    shamble: зомби, одна нога волочится.
    """
    P = GAITS[kind]
    beta, L, h, base, bob, lean = P["beta"], P["L"], P["h"], P["base"], P["bob"], P["lean"]
    ph = phase % 1.0
    if kind == "shamble":
        ph = (ph + 0.05 * math.sin(TAU * ph)) % 1.0
    pose = dict(view=view, neck=P.get("neck", 0.0), hturn=1.0 if view == "side" else 0.0)
    legs = []
    for i, off in enumerate((0.0, 0.5)):
        p = (ph + off) % 1.0
        hh = h if not (kind == "shamble" and i == 1) else h * 0.18
        if view == "side":
            if p < beta:
                s = p / beta
                fx = L * beta * (0.5 - s)
                heel = clamp((s - 0.72) / 0.28)
                fy = -0.07 * heel * P.get("heel", 1.0)
                fa = -0.55 * heel * P.get("heel", 1.0)
            else:
                s = (p - beta) / (1 - beta)
                e = s * s * (3 - 2 * s)
                fx = L * beta * (-0.5 + e) - P.get("kick", 0.0) * math.sin(math.pi * s) * (1 - s)
                fy = -hh * math.sin(math.pi * s) ** P.get("liftpow", 1.0) - 0.07 * (1 - s) ** 3 * P.get("heel", 1.0)
                fa = lerp(-0.55 * P.get("heel", 1.0), 0.28, s)
                if kind == "shamble" and i == 1:
                    fa = -0.35
            legs.append(((fx, fy), fa))
        else:
            # вид спереди/сзади: стопа поднимается, колено сгибается
            side = -0.16 if i == 0 else 0.16
            if p < beta:
                fy, fa = 0.0, 0.0
            else:
                s = (p - beta) / (1 - beta)
                fy = -hh * 0.75 * math.sin(math.pi * s)
                fa = 0.0
            legs.append(((side, fy), fa))
    pose["f1"], pose["fa1"] = legs[0]
    pose["f2"], pose["fa2"] = legs[1]
    mid = beta / 2
    if kind == "run":
        top = (beta + 0.5) / 2  # середина полёта
        hip_dy = -bob * math.cos(2 * TAU * (ph - top))
    else:
        hip_dy = -bob * math.cos(2 * TAU * (ph - mid))
    hip_dx = 0.0
    if view != "side":
        hip_dx = 0.045 * math.sin(TAU * ph)
    pose["hip"] = (hip_dx, (HIP_H - base) + hip_dy)
    pose["lean"] = lean + (0.06 * math.sin(TAU * ph) if kind == "shamble" else 0.015 * math.cos(2 * TAU * ph))
    # руки: противоход ногам
    A = P["arm"]
    if kind == "shamble":
        up = P.get("reach", 1.25)
        w = 0.08 * math.sin(TAU * ph + seed)
        pose["a1"] = (up + w, -0.25)
        pose["a2"] = (up - 0.15 - w, -0.15)
        pose["neck"] = 0.28 + 0.05 * math.sin(TAU * ph * 2)
    elif view == "side":
        for k, off in (("a1", 0.0), ("a2", 0.5)):
            c = -math.cos(TAU * ((ph + off) % 1.0))
            ang = A * c
            fwd = (c + 1) / 2
            fore = P["elbow"] + P["elbow2"] * fwd
            pose[k] = (ang + P.get("arm_off", 0.0), fore)
    else:
        for k, off in (("a1", 0.0), ("a2", 0.5)):
            c = math.cos(TAU * ((ph + off) % 1.0))
            pose[k] = (0.10 + 0.04 * c, -0.05 + 0.25 * max(0, c))
    pose["cycle"] = L
    return pose


GAITS = {
    "walk": dict(beta=0.62, L=1.6, h=0.22, base=1.63, bob=0.035, lean=0.06, arm=0.42, elbow=0.12, elbow2=0.32),
    "brisk": dict(beta=0.58, L=2.0, h=0.28, base=1.59, bob=0.045, lean=0.10, arm=0.55, elbow=0.2, elbow2=0.45),
    "run": dict(beta=0.38, L=3.2, h=0.66, base=1.50, bob=0.07, lean=0.26, arm=0.85, elbow=1.15, elbow2=0.35,
                kick=0.35, heel=0.6),
    "sneak": dict(beta=0.66, L=1.05, h=0.20, base=1.52, bob=0.02, lean=0.20, arm=0.25, elbow=0.9, elbow2=0.2,
                  heel=1.4, arm_off=0.35),
    "shamble": dict(beta=0.66, L=1.0, h=0.16, base=1.62, bob=0.04, lean=0.14, arm=0.1, elbow=0.0, elbow2=0.0,
                    neck=0.28, reach=1.25),
    "push": dict(beta=0.72, L=0.95, h=0.12, base=1.56, bob=0.02, lean=0.45, arm=0.0, elbow=0.0, elbow2=0.0,
                 heel=1.3),
    "trudge": dict(beta=0.66, L=1.15, h=0.12, base=1.62, bob=0.025, lean=0.16, arm=0.18, elbow=0.1, elbow2=0.1,
                   neck=0.25),
}


def blend(a, b, w):
    """Смешивание двух поз (w=0 → a, w=1 → b)."""
    if w <= 0:
        return a
    if w >= 1:
        return b
    out = dict(a)
    for k, vb in b.items():
        va = a.get(k)
        if va is None:
            out[k] = vb
        elif isinstance(vb, (int, float)) and isinstance(va, (int, float)):
            out[k] = va + (vb - va) * w
        elif isinstance(vb, tuple) and isinstance(va, tuple) and len(va) == len(vb) and all(
                isinstance(x, (int, float)) for x in va + vb):
            out[k] = tuple(x + (y - x) * w for x, y in zip(va, vb))
        else:
            out[k] = vb if w > 0.5 else va
    return out


# --- IK ---------------------------------------------------------------------

def ik2(hx, hy, tx, ty, l1, l2, bend=1.0):
    dx, dy = tx - hx, ty - hy
    d = math.hypot(dx, dy)
    d = clamp(d, abs(l1 - l2) + 1e-4, l1 + l2 - 1e-4)
    a = math.atan2(dy, dx)
    cA = (l1 * l1 + d * d - l2 * l2) / (2 * l1 * d)
    A = math.acos(clamp(cA, -1.0, 1.0))
    ka = a - bend * A
    kx, ky = hx + l1 * math.cos(ka), hy + l1 * math.sin(ka)
    return (kx, ky), (hx + d * math.cos(a), hy + d * math.sin(a))


def rot(x, y, a):
    c, s = math.cos(a), math.sin(a)
    return x * c - y * s, x * s + y * c


def fk_dir(theta):
    """Направление по углу: 0 — вниз, + — вперёд."""
    return math.sin(theta), math.cos(theta)


# --- отрисовка ----------------------------------------------------------------

class Fig:
    """Персонаж = внешний вид + отрисовка позы."""

    def __init__(self, look):
        self.look = look

    def joints(self, pose):
        """Координаты суставов в локальных u (y вниз, земля = 0)."""
        L = self.look
        view = pose.get("view", "side")
        hx, hy = pose.get("hip", (0.0, 0.0))
        hip = (hx, -HIP_H + hy)
        lean = pose.get("lean", 0.0)
        tx, ty = rot(0, -TORSO, lean)
        top = (hip[0] + tx, hip[1] + ty)
        J = dict(hip=hip, top=top, lean=lean, view=view)
        # ноги
        for i in (1, 2):
            hipx = hip[0] + (0 if view == "side" else (-0.13 if i == 1 else 0.13))
            hp = (hipx, hip[1])
            if ("k%d" % i) in pose:
                th, kn = pose["k%d" % i]
                dx, dy = fk_dir(th)
                knee = (hp[0] + THIGH * dx, hp[1] + THIGH * dy)
                dx, dy = fk_dir(th - kn)
                foot = (knee[0] + SHIN * dx, knee[1] + SHIN * dy)
            else:
                fx, fy = pose.get("f%d" % i, (0.0, 0.0))
                bend = 1.0 if view == "side" else (1.0 if i == 2 else -1.0) * 0.35
                if view == "side":
                    knee, foot = ik2(hp[0], hp[1], fx, fy - 0.03, THIGH, SHIN, bend)
                else:
                    knee, foot = ik2(hp[0], hp[1], fx, fy - 0.03, THIGH, SHIN, 1.0 if i == 2 else -1.0)
                    # в анфас колено почти не уходит в сторону
                    mx, my = (hp[0] + foot[0]) / 2, (hp[1] + foot[1]) / 2
                    knee = (mx + (knee[0] - mx) * 0.35, knee[1])
            J["hipj%d" % i] = hp
            J["knee%d" % i] = knee
            J["foot%d" % i] = foot
        # плечи и руки
        sh_y = 0.12
        for i in (1, 2):
            if view == "side":
                sx, sy = rot(0.0, sh_y, lean)
            else:
                sw = 0.25 * (1 + (L.girth - 1) * 0.55)
                sx, sy = rot(-sw if i == 1 else sw, sh_y, lean)
            sp = (top[0] + sx, top[1] + sy)
            if ("h%d" % i) in pose:
                hxp, hyp = pose["h%d" % i]
                bend = -1.0 if view == "side" else (1.0 if i == 1 else -1.0)
                elbow, hand = ik2(sp[0], sp[1], hxp, hyp, UARM, FARM, bend)
            else:
                ua, fa = pose.get("a%d" % i, (0.0, 0.1))
                if view != "side":
                    ua = -ua if i == 1 else ua   # + наружу
                    fa = -fa if i == 1 else fa
                ua += lean
                dx, dy = fk_dir(ua)
                elbow = (sp[0] + UARM * dx, sp[1] + UARM * dy)
                dx, dy = fk_dir(ua + fa)
                hand = (elbow[0] + FARM * dx, elbow[1] + FARM * dy)
            J["sh%d" % i] = sp
            J["elbow%d" % i] = elbow
            J["hand%d" % i] = hand
        neck = pose.get("neck", 0.0)
        nl = NECK if L.neck_len is None else L.neck_len
        nx, ny = rot(0, -nl - 0.5 * L.head_scale, lean + neck)
        J["head"] = (top[0] + nx, top[1] + ny)
        J["head_ang"] = (lean + neck) * 0.6
        return J

    # ------------------------------------------------------------------
    def draw(self, ctx, x, gy, s, f, pose, alpha=1.0, extra=None):
        """Нарисовать фигуру. extra(ctx, J, layer) — дорисовка предметов в руках."""
        L = self.look
        s = s * L.scale
        ctx.save()
        ctx.translate(x, gy)
        ctx.scale(f * s, s)
        J = self.joints(pose)
        view = J["view"]
        lw = max(LIMB_W * L.limb_k, 1.6 / s)
        ow = max(OUT_W, 1.1 / s)
        if alpha < 1:
            ctx.push_group()
        limb = L.limb
        far = mix(limb, (0.42, 0.37, 0.35), 0.18)
        if extra:
            extra(ctx, J, "back")
        if L.tail and view != "back":
            self._tail(ctx, J, pose, ow, view)
        if view == "side":
            self._arm(ctx, J, 2, far, lw)
            if extra:
                extra(ctx, J, "far_hand")
            self._leg(ctx, J, 2, far, lw, pose.get("fa2", 0.0))
            self._leg(ctx, J, 1, limb, lw, pose.get("fa1", 0.0))
            self._torso(ctx, J, ow, f)
            self._neck(ctx, J, limb, lw)
            self._head(ctx, J, pose, ow, f)
            if extra:
                extra(ctx, J, "mid")
            self._arm(ctx, J, 1, limb, lw)
        else:
            back = view == "back"
            if back:
                self._neck(ctx, J, limb, lw)
                self._head(ctx, J, pose, ow, f)
            self._leg(ctx, J, 1, limb, lw, 0.0)
            self._leg(ctx, J, 2, limb, lw, 0.0)
            if not back:
                self._arm(ctx, J, 1, limb, lw)
                self._arm(ctx, J, 2, limb, lw)
            self._torso(ctx, J, ow, f)
            if back:
                if L.tail:
                    self._tail(ctx, J, pose, ow, view)
                self._arm(ctx, J, 1, limb, lw)
                self._arm(ctx, J, 2, limb, lw)
            else:
                self._neck(ctx, J, limb, lw)
                self._head(ctx, J, pose, ow, f)
            if extra:
                extra(ctx, J, "mid")
        if extra:
            extra(ctx, J, "front")
        if alpha < 1:
            ctx.pop_group_to_source()
            ctx.paint_with_alpha(alpha)
        ctx.restore()
        return J

    def world(self, x, gy, s, f, pt):
        """Локальная точка → координаты кадра."""
        s = s * self.look.scale
        return x + f * s * pt[0], gy + s * pt[1]

    def head_only(self, ctx, x, y, s, f, pose):
        """Только голова (для крупных планов): центр головы в (x, y)."""
        ctx.save()
        ctx.translate(x, y)
        ctx.scale(f * s, s)
        J = dict(head=(0.0, 0.0), head_ang=pose.get("hang", 0.0), view=pose.get("view", "front"))
        ow = max(OUT_W, 1.1 / s)
        lw = max(LIMB_W, 1.6 / s)
        if pose.get("neck_line", True):
            D.col(ctx, self.look.limb)
            ctx.set_line_width(lw)
            ctx.set_line_cap(cairo.LINE_CAP_ROUND)
            ctx.move_to(0, 0.3)
            ctx.line_to(0, 1.2)
            ctx.stroke()
        self._head(ctx, J, pose, ow, f)
        ctx.restore()

    # ------------------------------------------------------------------
    def _neck(self, ctx, J, c, lw):
        D.col(ctx, c)
        ctx.set_line_width(lw * 0.95)
        ctx.set_line_cap(cairo.LINE_CAP_ROUND)
        tx, ty = J["top"]
        hx, hy = J["head"]
        ctx.move_to(tx, ty + 0.05)
        ctx.line_to(hx, hy)
        ctx.stroke()

    def _leg(self, ctx, J, i, c, lw, fa):
        hp, kn, ft = J["hipj%d" % i], J["knee%d" % i], J["foot%d" % i]
        if self.look.fur is not None:
            return self._fur_leg(ctx, J, i, c, lw, fa)
        D.col(ctx, c)
        ctx.set_line_width(lw)
        ctx.set_line_cap(cairo.LINE_CAP_ROUND)
        ctx.set_line_join(cairo.LINE_JOIN_ROUND)
        ctx.move_to(*hp)
        ctx.line_to(*kn)
        ctx.line_to(*ft)
        ctx.stroke()
        # стопа
        if J["view"] == "side":
            dx, dy = math.cos(fa), math.sin(fa)
            ctx.set_line_width(lw * 1.25)
            ctx.move_to(ft[0] - dx * 0.03, ft[1] - dy * 0.03)
            ctx.line_to(ft[0] + dx * 0.17, ft[1] + dy * 0.17 + 0.01)
            ctx.stroke()
        else:
            ctx.set_line_width(lw * 1.25)
            o = -0.07 if i == 1 else 0.07
            ctx.move_to(ft[0], ft[1] + 0.01)
            ctx.line_to(ft[0] + o, ft[1] + 0.02)
            ctx.stroke()

    def _arm(self, ctx, J, i, c, lw):
        sp, el, hd = J["sh%d" % i], J["elbow%d" % i], J["hand%d" % i]
        if self.look.fur is not None:
            return self._fur_arm(ctx, J, i, c, lw)
        D.col(ctx, c)
        ctx.set_line_width(lw * 0.92)
        ctx.set_line_cap(cairo.LINE_CAP_ROUND)
        ctx.set_line_join(cairo.LINE_JOIN_ROUND)
        ctx.move_to(*sp)
        ctx.line_to(*el)
        ctx.line_to(*hd)
        ctx.stroke()
        ctx.arc(hd[0], hd[1], lw * 0.62, 0, TAU)
        ctx.fill()

    # --- ростовая кукла: мех, перчатки, лапы, хвост, голова -----------------------
    def _fur_col(self, c):
        """Цвет меха с учётом дальней (затенённой) конечности."""
        L = self.look
        return shade(L.fur, -0.16) if c != L.limb else L.fur

    def _fur_stroke(self, ctx, pts, w, col):
        ctx.set_line_cap(cairo.LINE_CAP_ROUND)
        ctx.set_line_join(cairo.LINE_JOIN_ROUND)
        for cc, ww in ((D.INK, w + 0.07), (col, w)):
            D.col(ctx, cc)
            ctx.set_line_width(ww)
            ctx.move_to(*pts[0])
            for q in pts[1:]:
                ctx.line_to(*q)
            ctx.stroke()

    def _fur_leg(self, ctx, J, i, c, lw, fa):
        hp, kn, ft = J["hipj%d" % i], J["knee%d" % i], J["foot%d" % i]
        col = self._fur_col(c)
        self._fur_stroke(ctx, [hp, kn, ft], 0.24, col)
        shoe = shade(col, -0.45)
        if J["view"] == "side":
            ctx.save()
            ctx.translate(ft[0] + 0.1, ft[1] - 0.05)
            ctx.rotate(fa)
            D.ellipse(ctx, 0, 0, 0.21, 0.1, shoe, D.INK, 0.035)
            ctx.restore()
        else:
            o = -0.05 if i == 1 else 0.05
            D.ellipse(ctx, ft[0] + o, ft[1] - 0.05, 0.13, 0.09, shoe, D.INK, 0.035)

    def _fur_arm(self, ctx, J, i, c, lw):
        sp, el, hd = J["sh%d" % i], J["elbow%d" % i], J["hand%d" % i]
        col = self._fur_col(c)
        self._fur_stroke(ctx, [sp, el, hd], 0.2, col)
        glove = hexrgb("#fbfaf6") if c == self.look.limb else hexrgb("#e2e0da")
        D.circle(ctx, hd[0], hd[1], 0.12, glove, D.INK, 0.035)
        # большой палец
        dx, dy = hd[0] - el[0], hd[1] - el[1]
        n = math.hypot(dx, dy) or 1
        px, py = -dy / n, dx / n
        D.circle(ctx, hd[0] + px * 0.09 + dx / n * 0.03, hd[1] + py * 0.09 + dy / n * 0.03, 0.045, glove, D.INK, 0.03)

    def _tail(self, ctx, J, pose, ow, view):
        L = self.look
        hx, hy = J["hip"]
        t = pose.get("t", 0.0)
        sw = math.sin(t * 2.0) * 0.06 + pose.get("tail_sw", 0.0)
        if view == "side":
            b = (hx - 0.22, hy + 0.02)
            pts = [b, (b[0] - 0.32, b[1] + 0.2), (b[0] - 0.7, b[1] + 0.12 + sw), (b[0] - 0.95, b[1] - 0.2 + sw * 2)]
        elif view == "back":
            b = (hx, hy - 0.05)
            pts = [b, (b[0] + 0.12, b[1] + 0.3), (b[0] + 0.45, b[1] + 0.3 + sw), (b[0] + 0.62, b[1] + 0.02 + sw)]
        else:
            b = (hx + 0.18, hy + 0.05)
            pts = [b, (b[0] + 0.32, b[1] + 0.12), (b[0] + 0.58, b[1] - 0.05 + sw), (b[0] + 0.66, b[1] - 0.35 + sw)]
        ctx.set_line_cap(cairo.LINE_CAP_ROUND)
        ctx.set_line_join(cairo.LINE_JOIN_ROUND)
        D.col(ctx, D.INK)
        ctx.set_line_width(0.3)
        D.catmull(ctx, pts)
        ctx.stroke()
        D.col(ctx, L.fur)
        ctx.set_line_width(0.23)
        D.catmull(ctx, pts)
        ctx.stroke()
        D.col(ctx, hexrgb("#2b2c31"))
        ctx.set_line_cap(cairo.LINE_CAP_BUTT)
        ctx.set_dash([0.11, 0.13], 0.16)
        D.catmull(ctx, pts)
        ctx.stroke()
        ctx.set_dash([])
        D.circle(ctx, pts[-1][0], pts[-1][1], 0.115, hexrgb("#2b2c31"), None, 0)

    def _torso(self, ctx, J, ow, f):
        L = self.look
        hip, lean, view = J["hip"], J["lean"], J["view"]
        side = view == "side"
        wt, wb = (0.38, 0.44) if side else (0.56, 0.60)
        g = L.girth
        wt *= 1 + (g - 1) * 0.55
        wb *= g
        ext = 0.14 + L.length
        if L.style in ("coat", "dress"):
            wb += 0.12 + L.length * (0.35 if L.style == "dress" else 0.18)
        # живот: бока выгибаются наружу (в профиль — только вперёд)
        bulge = max(0.0, g - 1.0) * 0.55
        bl = 0.0 if side else bulge
        # скругление плеч
        ctx.save()
        ctx.translate(*hip)
        ctx.rotate(lean)
        r = 0.09
        ctx.move_to(-wt / 2, -TORSO + r)
        ctx.arc(-wt / 2 + r, -TORSO + r, r, math.pi, 1.5 * math.pi)
        ctx.arc(wt / 2 - r, -TORSO + r, r, 1.5 * math.pi, 2 * math.pi)
        if bulge > 0:
            ctx.curve_to(wt / 2 + bulge * 0.4, -TORSO * 0.55, wb / 2 + bulge, -0.15, wb / 2, ext)
        if L.style == "dress" or "torn" in L.details:
            # рваный подол
            n = 5
            ctx.line_to(wb / 2, ext - 0.05)
            for k in range(n + 1):
                xx = wb / 2 - wb * k / n
                yy = ext + (0.06 if k % 2 else -0.02)
                ctx.line_to(xx, yy)
        else:
            ctx.line_to(wb / 2, ext)
            ctx.line_to(-wb / 2, ext)
        if bulge > 0:
            ctx.curve_to(-wb / 2 - bl, -0.15, -wt / 2 - bl * 0.4, -TORSO * 0.55, -wt / 2, -TORSO + r)
        ctx.close_path()
        D.col(ctx, L.body)
        ctx.fill_preserve()
        ctx.save()
        ctx.clip_preserve()
        outline = None
        if L.torso_line:
            outline = ctx.copy_path()
            ctx.new_path()
        # тень на спине
        D.col(ctx, shade(L.body, -0.18))
        bx = -wb / 2 if side else wb / 2 - 0.12
        ctx.rectangle(bx - 0.02, -TORSO - 0.1, 0.13, TORSO + ext + 0.4)
        ctx.fill()
        self._details(ctx, wt, wb, ext, side, f)
        ctx.restore()
        if outline is not None:
            ctx.new_path()
            ctx.append_path(outline)
        D.col(ctx, D.INK)
        ctx.set_line_width(ow)
        ctx.set_line_join(cairo.LINE_JOIN_ROUND)
        ctx.stroke()
        ctx.restore()

    def _details(self, ctx, wt, wb, ext, side, f):
        L = self.look
        det = L.details
        cx = 0.04 if side else 0.0
        if "starshirt" in det:   # футболка Starfall Park: жёлтая звезда на груди
            sx = 0.08 if side else 0.0
            pts = []
            for k in range(10):
                r_ = 0.13 if k % 2 == 0 else 0.055
                a_ = -math.pi / 2 + k * math.pi / 5
                pts.append((sx + math.cos(a_) * r_, -0.72 + math.sin(a_) * r_))
            D.col(ctx, hexrgb("#ffd23a"))
            ctx.move_to(*pts[0])
            for q in pts[1:]:
                ctx.line_to(*q)
            ctx.close_path()
            ctx.fill()
        if "staffstripes" in det:   # полосатая рубашка работника парка
            D.col(ctx, hexrgb("#fbfaf4"))
            for k in range(7):
                ctx.rectangle(-1.5, -TORSO + 0.06 + k * 0.17, 3.0, 0.07)
            ctx.fill()
        if "patch" in det:   # радужная заплатка из ткани шара на боку
            px = -0.06 if side else -0.24
            cols = ["#e8423c", "#f2a03a", "#ffd23a", "#3fbf6a", "#2f8fd8", "#7a4fc2"]
            for k, c_ in enumerate(cols):
                D.col(ctx, hexrgb(c_))
                ctx.rectangle(px, -0.62 + k * 0.045, 0.26, 0.046)
                ctx.fill()
            D.col(ctx, D.INK)
            ctx.set_line_width(0.012)
            ctx.set_dash([0.025, 0.02])
            ctx.rectangle(px, -0.62, 0.26, 0.27)
            ctx.stroke()
            ctx.set_dash([])
        if "rip" in det:     # разорванный бок
            px = -0.1 if side else -0.22
            ctx.move_to(px, -0.62)
            for k in range(7):
                ctx.line_to(px + 0.04 + k * 0.035, -0.62 + (0.06 if k % 2 else -0.03) + k * 0.035)
            ctx.line_to(px + 0.1, -0.3)
            for k in range(6):
                ctx.line_to(px + 0.06 - k * 0.03, -0.32 - (0.05 if k % 2 else 0.0) - k * 0.05)
            ctx.close_path()
            D.col(ctx, hexrgb("#f3d6bd"))
            ctx.fill_preserve()
            D.col(ctx, D.INK)
            ctx.set_line_width(0.02)
            ctx.stroke()
        if "vest" in det:   # светоотражающий жилет
            D.col(ctx, hexrgb("#e8853a"))
            ctx.rectangle(-1.5, -TORSO, 3.0, TORSO + ext)
            ctx.fill()
            D.col(ctx, hexrgb("#f1e9c8"))
            ctx.rectangle(-1.5, -0.62, 3.0, 0.09)
            ctx.rectangle(-1.5, -0.3, 3.0, 0.09)
            ctx.fill()
        if "apron" in det:
            D.col(ctx, L.body2 or hexrgb("#f1e9d8"))
            ctx.rectangle(-0.17 + cx, -0.75, 0.34, 0.9)
            ctx.fill()
        if "stripes" in det:
            D.col(ctx, L.body2 or shade(L.body, -0.2))
            for k in range(4):
                ctx.rectangle(-1.5, -TORSO + 0.2 + k * 0.28, 3.0, 0.1)
            ctx.fill()
        if "tie" in det:
            D.col(ctx, L.body2 or hexrgb("#9b3b34"))
            tx = 0.12 if side else 0.0
            ctx.move_to(tx - 0.035, -TORSO + 0.02)
            ctx.line_to(tx + 0.035, -TORSO + 0.02)
            ctx.line_to(tx + 0.06, -0.55)
            ctx.line_to(tx, -0.47)
            ctx.line_to(tx - 0.06, -0.55)
            ctx.close_path()
            ctx.fill()
        if "pocket" in det:
            D.col(ctx, shade(L.body, -0.12))
            px = 0.02 if side else -0.2
            ctx.rectangle(px, -0.92, 0.14, 0.16)
            ctx.fill()
        if "nametag" in det:
            px = 0.0 if side else 0.08
            D.col(ctx, hexrgb("#efe6d2"))
            ctx.rectangle(px, -0.95, 0.17, 0.08)
            ctx.fill()
        if "badge" in det:
            px = 0.03 if side else 0.1
            D.col(ctx, hexrgb("#d6b24c"))
            ctx.arc(px + 0.06, -0.88, 0.055, 0, TAU)
            ctx.fill()
        if "belt" in det:
            D.col(ctx, shade(L.body, -0.35))
            ctx.rectangle(-1.5, -0.08, 3.0, 0.08)
            ctx.fill()
        if "iloveny" in det:
            ctx.save()
            ctx.scale(f, 1)
            ctx.select_font_face(D.FONT_TITLE)
            ctx.set_font_size(0.13)
            D.col(ctx, hexrgb("#2a201c"))
            tx = -0.14 if not side else (-0.12 if f > 0 else -0.08)
            ctx.move_to(tx, -0.62)
            ctx.show_text("I")
            D.col(ctx, hexrgb("#c23b33"))
            ctx.show_text("♥")
            D.col(ctx, hexrgb("#2a201c"))
            ctx.move_to(tx - 0.01, -0.48)
            ctx.show_text("NY")
            ctx.restore()
        if "stains" in det:
            rr = L.seed
            D.col(ctx, shade(L.body, -0.35), 0.55)
            for k in range(3):
                sx = math.sin(rr * 3.1 + k * 2.3) * 0.15
                sy = -0.9 + ((rr * 7 + k * 5) % 9) / 9 * 0.9
                ctx.arc(sx, sy, 0.05 + 0.03 * (k % 2), 0, TAU)
                ctx.fill()
        if "belly" in det:    # рубашка мала: снизу торчит живот с пупком
            D.col(ctx, L.head)
            ctx.rectangle(-1.5, -0.24, 3.0, 1.0)
            ctx.fill()
            D.col(ctx, L.head_shade)
            ctx.rectangle(-1.5, 0.02, 3.0, 1.0)
            ctx.fill()
            D.col(ctx, D.INK)
            ctx.set_line_width(0.035)
            ctx.move_to(-1.5, -0.2)
            ctx.curve_to(-0.3, -0.3, 0.3, -0.3, 1.5, -0.2)
            ctx.stroke()
            ctx.set_line_width(0.022)
            ctx.arc(cx, -0.06, 0.035, 0.3, math.pi * 2 - 0.3)
            ctx.stroke()
        if "buttons" in det:  # пуговицы еле держатся
            D.col(ctx, D.INK)
            ctx.set_line_width(0.018)
            for y in (-0.82, -0.6, -0.4):
                ctx.move_to(cx - 0.12, y - 0.03)
                ctx.line_to(cx - 0.03, y)
                ctx.line_to(cx - 0.12, y + 0.03)
                ctx.move_to(cx + 0.12, y - 0.03)
                ctx.line_to(cx + 0.03, y)
                ctx.line_to(cx + 0.12, y + 0.03)
            ctx.stroke()
            for y in (-0.82, -0.6, -0.4):
                ctx.arc(cx, y, 0.03, 0, TAU)
                D.col(ctx, hexrgb("#e9dfc8"))
                ctx.fill_preserve()
                D.col(ctx, D.INK)
                ctx.set_line_width(0.012)
                ctx.stroke()
        if "hawaiian" in det:   # гавайская рубашка: цветы и листья
            r = L.seed * 7 + 3
            c1 = L.body2 or hexrgb("#ffd84a")
            c2 = shade(L.body, 0.35)
            for k in range(14):
                fx_ = -0.5 + ((r * 13 + k * 37) % 100) / 100
                fy_ = -TORSO + 0.05 + ((r * 7 + k * 53) % 100) / 100 * (TORSO + ext)
                if k % 2:
                    D.col(ctx, c2)
                    ctx.save()
                    ctx.translate(fx_, fy_)
                    ctx.rotate(k)
                    ctx.scale(0.08, 0.035)
                    ctx.arc(0, 0, 1, 0, TAU)
                    ctx.restore()
                    ctx.fill()
                else:
                    D.col(ctx, c1)
                    for j in range(5):
                        a = j * TAU / 5 + k
                        ctx.arc(fx_ + math.cos(a) * 0.035, fy_ + math.sin(a) * 0.035, 0.03, 0, TAU)
                        ctx.fill()
                    D.col(ctx, hexrgb("#c23b33"))
                    ctx.arc(fx_, fy_, 0.018, 0, TAU)
                    ctx.fill()
            # воротник
            D.col(ctx, shade(L.body, -0.2))
            ctx.move_to(cx - 0.16, -TORSO)
            ctx.line_to(cx, -TORSO + 0.22)
            ctx.line_to(cx + 0.16, -TORSO)
            ctx.close_path()
            ctx.fill()
        if "robe" in det:        # махровый халат: вырез, лацканы, пояс
            D.col(ctx, L.head)
            ctx.move_to(cx - 0.13, -TORSO)
            ctx.line_to(cx + 0.02, -TORSO + 0.38)
            ctx.line_to(cx + 0.13, -TORSO)
            ctx.close_path()
            ctx.fill()
            D.col(ctx, shade(L.body, -0.15))
            ctx.set_line_width(0.05)
            ctx.move_to(cx - 0.17, -TORSO)
            ctx.line_to(cx + 0.02, -TORSO + 0.42)
            ctx.line_to(cx + 0.06, ext)
            ctx.stroke()
            ctx.rectangle(-1.5, -0.42, 3.0, 0.08)
            ctx.fill()
            ctx.move_to(cx + 0.02, -0.38)
            ctx.line_to(cx - 0.05, -0.12)
            ctx.move_to(cx + 0.04, -0.38)
            ctx.line_to(cx + 0.12, -0.14)
            ctx.stroke()
        if "trunks" in det:      # голый торс и плавки
            D.col(ctx, L.head)
            ctx.rectangle(-1.5, -TORSO - 0.2, 3.0, TORSO + 0.06)
            ctx.fill()
            D.col(ctx, L.head_shade)
            ctx.rectangle(-1.5 if side else 0.12, -TORSO - 0.2, 1.35 if side else 1.5, TORSO + 0.06)
            ctx.fill()
            D.col(ctx, shade(L.head, -0.35))
            ctx.set_line_width(0.02)
            ctx.arc(cx, -0.32, 0.02, 0, TAU)
            ctx.stroke()
            ctx.move_to(-1.5, -0.14)
            ctx.line_to(1.5, -0.14)
            ctx.stroke()
        if "tanktop" in det:     # майка: открытые плечи
            D.col(ctx, L.head)
            for sx in (-1, 1):
                ctx.move_to(sx * 0.4, -TORSO - 0.1)
                ctx.line_to(sx * 0.12, -TORSO - 0.1)
                ctx.curve_to(sx * 0.12, -TORSO + 0.2, sx * 0.25, -TORSO + 0.3, sx * 0.4, -TORSO + 0.3)
                ctx.close_path()
                ctx.fill()
        if "waiter" in det:      # белая рубашка и чёрный жилет
            D.col(ctx, hexrgb("#262330"))
            for sx in ((-1, 1) if not side else (-1,)):
                ctx.move_to(sx * 0.6 + cx, -TORSO + 0.05)
                ctx.line_to(cx + sx * 0.07, -TORSO + 0.3)
                ctx.line_to(cx + sx * 0.03, ext)
                ctx.line_to(sx * 0.6 + cx, ext)
                ctx.close_path()
                ctx.fill()
            if side:
                ctx.rectangle(-0.6, -TORSO, 0.5, TORSO + ext)
                ctx.fill()
            D.col(ctx, hexrgb("#d9d4c8"))
            for y in (-0.5, -0.3):
                ctx.arc(cx + 0.06, y, 0.022, 0, TAU)
                ctx.fill()
        if "bowtie" in det:
            c = L.body2 if (L.body2 is not None and "waiter" in det) else hexrgb("#d23a3a")
            bx = cx + (0.06 if side else 0.0)
            D.col(ctx, c)
            ctx.move_to(bx, -TORSO + 0.07)
            ctx.line_to(bx - 0.1, -TORSO + 0.0)
            ctx.line_to(bx - 0.1, -TORSO + 0.14)
            ctx.close_path()
            ctx.move_to(bx, -TORSO + 0.07)
            ctx.line_to(bx + 0.1, -TORSO + 0.0)
            ctx.line_to(bx + 0.1, -TORSO + 0.14)
            ctx.close_path()
            ctx.fill()
            ctx.arc(bx, -TORSO + 0.07, 0.03, 0, TAU)
            ctx.fill()
        if "polo" in det:
            D.col(ctx, shade(L.body, -0.18))
            ctx.move_to(cx - 0.14, -TORSO)
            ctx.line_to(cx, -TORSO + 0.12)
            ctx.line_to(cx + 0.14, -TORSO)
            ctx.close_path()
            ctx.fill()
            ctx.rectangle(cx - 0.012, -TORSO + 0.1, 0.024, 0.2)
            ctx.fill()
        if "lanyard" in det:
            D.col(ctx, hexrgb("#2f6fb3"))
            ctx.set_line_width(0.025)
            ctx.move_to(cx - 0.1, -TORSO)
            ctx.line_to(cx, -0.62)
            ctx.line_to(cx + 0.1, -TORSO)
            ctx.stroke()
            D.col(ctx, hexrgb("#f4f1ea"))
            ctx.rectangle(cx - 0.06, -0.64, 0.12, 0.15)
            ctx.fill()
        if "chef" in det:
            D.col(ctx, hexrgb("#c9c4b8"))
            for col_ in (-0.08, 0.08):
                for y in (-0.85, -0.65, -0.45):
                    ctx.arc(cx + col_, y, 0.022, 0, TAU)
                    ctx.fill()
        if "scrubs" in det:
            D.col(ctx, shade(L.body, -0.2))
            ctx.set_line_width(0.025)
            ctx.move_to(cx - 0.13, -TORSO)
            ctx.line_to(cx, -TORSO + 0.2)
            ctx.line_to(cx + 0.13, -TORSO)
            ctx.stroke()
            ctx.rectangle(cx - 0.2, -0.6, 0.14, 0.12)
            ctx.fill()
        if "epaulettes" in det:
            for sx in ((-1, 1) if not side else (1,)):
                x0 = cx + sx * 0.2 - 0.09 if not side else -0.05
                D.col(ctx, hexrgb("#1f2433"))
                ctx.rectangle(x0, -TORSO, 0.18, 0.07)
                ctx.fill()
                D.col(ctx, hexrgb("#e3b84a"))
                for j in range(3):
                    ctx.rectangle(x0 + 0.02 + j * 0.055, -TORSO + 0.01, 0.025, 0.05)
                ctx.fill()
            D.col(ctx, hexrgb("#e3b84a"))
            for y in (-0.85, -0.6, -0.35):
                ctx.arc(cx + 0.03, y, 0.022, 0, TAU)
                ctx.fill()
        if "cruisetee" in det:
            ctx.save()
            ctx.scale(f, 1)
            ctx.select_font_face(D.FONT_TITLE)
            ctx.set_font_size(0.1)
            tx = -0.16 if not side else (-0.12 if f > 0 else -0.08)
            D.col(ctx, hexrgb("#2a201c"))
            ctx.move_to(tx, -0.66)
            ctx.show_text("I")
            D.col(ctx, hexrgb("#c23b33"))
            ctx.show_text("♥")
            D.col(ctx, hexrgb("#2a201c"))
            ctx.move_to(tx - 0.04, -0.54)
            ctx.show_text("CRUISE")
            ctx.restore()
        if "lifevest" in det:    # оранжевый спасжилет поверх
            D.col(ctx, hexrgb("#f2782e"))
            if side:
                ctx.rectangle(-0.6, -TORSO - 0.05, 1.2, TORSO * 0.85)
                ctx.fill()
            else:
                for sx in (-1, 1):
                    ctx.rectangle(cx + sx * 0.03 if sx > 0 else -0.6, -TORSO - 0.05, 0.57, TORSO * 0.85)
                ctx.fill()
            D.col(ctx, hexrgb("#f2f0e6"))
            ctx.rectangle(-1.5, -0.62, 3.0, 0.05)
            ctx.fill()
            D.col(ctx, hexrgb("#1f2433"))
            ctx.rectangle(-1.5, -0.42, 3.0, 0.05)
            ctx.fill()
            ctx.rectangle(cx - 0.04 + (0.08 if side else 0), -0.44, 0.08, 0.09)
            ctx.fill()
        if "jacket" in det:   # куртка поверх
            D.col(ctx, L.body2 or shade(L.body, -0.15))
            ctx.rectangle(-0.4, -TORSO, 0.4 if not side else 0.18, TORSO + ext)
            ctx.fill()
            if not side:
                ctx.rectangle(0.07, -TORSO, 0.4, TORSO + ext)
                ctx.fill()
        if "hivis" in det:    # оранжевый жилет нараспашку со светоотражающими полосами
            vc = hexrgb("#ff8a1c")
            panels = [(-1.5, 1.38)] if side else [(-1.5, 1.43), (0.07, 1.43)]
            if side:
                panels = [(-1.5, 1.6)]
            for (px, pw) in panels:
                D.col(ctx, vc)
                ctx.rectangle(px, -TORSO + 0.06, pw, TORSO + ext)
                ctx.fill()
                for yy in (-0.66, -0.34):
                    D.col(ctx, hexrgb("#e9eef2"))
                    ctx.rectangle(px, yy, pw, 0.09)
                    ctx.fill()
                    D.col(ctx, hexrgb("#b8c2c8"))
                    ctx.rectangle(px, yy + 0.065, pw, 0.025)
                    ctx.fill()
        if "suit" in det:     # пиджак, белая рубашка, красный галстук
            D.col(ctx, L.body2 or hexrgb("#3a4252"))
            if side:
                ctx.rectangle(-1.5, -TORSO, 1.57, TORSO + ext)
            else:
                ctx.rectangle(-1.5, -TORSO, 1.43, TORSO + ext)
                ctx.rectangle(0.07, -TORSO, 1.43, TORSO + ext)
            ctx.fill()
            D.col(ctx, hexrgb("#c23b33"))
            tx = 0.13 if side else 0.0
            ctx.move_to(tx - 0.03, -TORSO + 0.02)
            ctx.line_to(tx + 0.03, -TORSO + 0.02)
            ctx.line_to(tx + 0.05, -0.5)
            ctx.line_to(tx, -0.43)
            ctx.line_to(tx - 0.05, -0.5)
            ctx.close_path()
            ctx.fill()
        if "scarf" in det:    # шейный платок стюардессы
            D.col(ctx, hexrgb("#e8423c"))
            tx = 0.1 if side else 0.0
            ctx.move_to(tx - 0.16, -TORSO)
            ctx.line_to(tx + 0.16, -TORSO)
            ctx.line_to(tx + 0.02, -TORSO + 0.24)
            ctx.close_path()
            ctx.fill()
            D.col(ctx, hexrgb("#ffd84a"))
            ctx.arc(tx, -TORSO + 0.06, 0.04, 0, TAU)
            ctx.fill()
        if "wings" in det:    # золотые «крылышки» пилота
            px = 0.06 if side else -0.2
            D.col(ctx, hexrgb("#e3b84a"))
            ctx.move_to(px - 0.1, -0.86)
            ctx.curve_to(px - 0.04, -0.9, px + 0.04, -0.9, px + 0.1, -0.86)
            ctx.line_to(px + 0.05, -0.82)
            ctx.line_to(px - 0.05, -0.82)
            ctx.close_path()
            ctx.fill()
            ctx.arc(px, -0.85, 0.025, 0, TAU)
            ctx.fill()

    # ------------------------------------------------------------------
    def _head(self, ctx, J, pose, ow, f):
        L = self.look
        hx, hy = J["head"]
        R = 0.5 * L.head_scale
        view = J["view"]
        turn = pose.get("hturn", 1.0 if view == "side" else 0.0)
        if view == "back":
            turn = 0.0
        ctx.save()
        ctx.translate(hx, hy)
        ctx.rotate(J["head_ang"] + pose.get("htilt", 0.0))
        ctx.scale(R / 0.5, R / 0.5)
        if L.mascot_head:
            mascot_head(ctx, L, pose, turn, view, ow)
            ctx.restore()
            return
        if L.girth > 1.15 and pose.get("chin", True) and view != "back":
            # второй подбородок
            D.col(ctx, L.head_shade)
            ctx.save()
            ctx.translate(0.05 * turn, 0.42)
            ctx.scale(0.3, 0.12)
            ctx.arc(0, 0, 1, 0, math.pi)
            ctx.restore()
            ctx.fill_preserve()
            D.col(ctx, D.INK)
            ctx.set_line_width(ow)
            ctx.stroke()
        if L.hair:
            hair_back(ctx, L, turn, view)
        # голова с тенью
        ctx.arc(0, 0, 0.5, 0, TAU)
        D.col(ctx, L.head_shade)
        ctx.fill_preserve()
        ctx.save()
        ctx.clip()
        ctx.arc(0.07, -0.07, 0.47, 0, TAU)
        D.col(ctx, L.head)
        ctx.fill()
        ctx.restore()
        ctx.arc(0, 0, 0.5, 0, TAU)
        D.col(ctx, D.INK)
        ctx.set_line_width(ow * 1.15)
        ctx.stroke()
        if view != "back" and not getattr(L, "faceless", False):
            face(ctx, L, pose, turn)
        if L.hair:
            hair_front(ctx, L, turn, view)
        if L.hat:
            hat(ctx, L, turn, view, ow)
        if "neckpillow" in L.details:
            pc = getattr(L, "pillow_col", hexrgb("#f2c230"))
            pc = hexrgb(pc) if isinstance(pc, str) else pc
            ctx.new_path()
            ctx.arc(0.04 * turn, 0.08, 0.47, math.pi * 0.12, math.pi * 0.88)
            D.col(ctx, D.INK)
            ctx.set_line_width(0.24)
            ctx.set_line_cap(cairo.LINE_CAP_ROUND)
            ctx.stroke_preserve()
            D.col(ctx, pc)
            ctx.set_line_width(0.17)
            ctx.stroke()
        ctx.restore()


def mascot_head(ctx, L, pose, turn, view, ow):
    """Голова ростовой куклы енота Раскала (в единицах головы, радиус 0.5).

    Выражение куклы не меняется (вечная улыбка), но в сетке рта видны глаза того,
    кто внутри: pose["inner"] — None / "calm" / "scared" / "happy" / "sweat"."""
    fur = L.fur if L.fur is not None else hexrgb("#9a9ea6")
    dark = hexrgb("#2b2c31")
    white = hexrgb("#fbfaf6")
    ink = D.INK
    lw = 0.045
    back = view == "back"
    a = abs(turn)
    cx = 0.2 * turn
    spread = 0.19 * (1 - 0.5 * a)
    # уши (за головой)
    if back or a < 0.5:
        ears = [(-0.33, -0.37, -0.5), (0.33, -0.37, 0.5)]
    else:
        ears = [(-0.2 * turn, -0.44, -0.25 * turn), (0.12 * turn, -0.47, 0.15 * turn)]
    for ex, ey, rot_ in ears:
        ctx.save()
        ctx.translate(ex, ey)
        ctx.rotate(rot_)
        ctx.move_to(-0.15, 0.08)
        ctx.curve_to(-0.16, -0.12, -0.06, -0.2, 0.0, -0.2)
        ctx.curve_to(0.06, -0.2, 0.16, -0.12, 0.15, 0.08)
        ctx.close_path()
        D.col(ctx, white)
        ctx.fill_preserve()
        D.col(ctx, ink)
        ctx.set_line_width(lw)
        ctx.stroke()
        if not back:
            ctx.move_to(-0.09, 0.06)
            ctx.curve_to(-0.1, -0.08, -0.04, -0.13, 0.0, -0.13)
            ctx.curve_to(0.04, -0.13, 0.1, -0.08, 0.09, 0.06)
            ctx.close_path()
            D.col(ctx, dark)
            ctx.fill()
        ctx.restore()
    # сама голова
    ctx.arc(0, 0, 0.5, 0, TAU)
    D.col(ctx, shade(fur, -0.14))
    ctx.fill_preserve()
    ctx.save()
    ctx.clip()
    ctx.arc(0.06, -0.06, 0.47, 0, TAU)
    D.col(ctx, fur)
    ctx.fill()
    if back:
        D.col(ctx, shade(fur, -0.25))
        ctx.rectangle(-0.06, -0.5, 0.12, 0.6)
        ctx.fill()
        ctx.restore()
        ctx.arc(0, 0, 0.5, 0, TAU)
        D.col(ctx, ink)
        ctx.set_line_width(lw * 1.2)
        ctx.stroke()
        return
    # тёмная полоса на лбу
    D.col(ctx, shade(fur, -0.32))
    ctx.move_to(cx - 0.05, -0.5)
    ctx.line_to(cx + 0.05, -0.5)
    ctx.line_to(cx + 0.03, -0.12)
    ctx.line_to(cx - 0.03, -0.12)
    ctx.close_path()
    ctx.fill()
    # светлые «брови»
    e1 = (cx - spread, -0.04)
    e2 = (cx + spread, -0.04)
    for (x, y) in (e1, e2):
        D.ellipse(ctx, x, y - 0.15, 0.12 * (1 - 0.3 * a), 0.06, white, None, 0)
    # маска
    ctx.move_to(e1[0] - 0.2, e1[1] + 0.02)
    ctx.curve_to(e1[0] - 0.18, e1[1] - 0.14, e1[0] + 0.1, e1[1] - 0.12, cx, e1[1] - 0.04)
    ctx.curve_to(e2[0] - 0.1, e2[1] - 0.12, e2[0] + 0.18, e2[1] - 0.14, e2[0] + 0.2, e2[1] + 0.02)
    ctx.curve_to(e2[0] + 0.16, e2[1] + 0.16, e2[0] - 0.04, e2[1] + 0.12, cx, e2[1] + 0.07)
    ctx.curve_to(e1[0] + 0.04, e1[1] + 0.12, e1[0] - 0.16, e1[1] + 0.16, e1[0] - 0.2, e1[1] + 0.02)
    ctx.close_path()
    D.col(ctx, dark)
    ctx.fill()
    # морда
    mx = cx + 0.1 * turn
    D.ellipse(ctx, mx, 0.22, 0.24 - 0.04 * a, 0.17, white, None, 0)
    ctx.restore()
    # глаза куклы (большие, нарисованные)
    lx, ly = pose.get("look", (0.0, 0.0))
    for (x, y) in (e1, e2):
        D.ellipse(ctx, x, y, 0.085 * (1 - 0.25 * a), 0.095, white, ink, 0.025)
        D.circle(ctx, x + 0.025 * turn + lx * 0.03, y + 0.01 + ly * 0.03, 0.045, dark, None, 0)
        D.circle(ctx, x + 0.012 * turn + lx * 0.03, y - 0.02 + ly * 0.03, 0.016, white, None, 0)
    # рот-сетка с глазами внутри
    mo = 0.06 + 0.02 * pose.get("mouth", 0.0)
    my = 0.27
    ctx.move_to(mx - 0.16, my - 0.02)
    ctx.curve_to(mx - 0.12, my + 0.1 + mo, mx + 0.12, my + 0.1 + mo, mx + 0.16, my - 0.02)
    ctx.close_path()
    D.col(ctx, hexrgb("#3a1f22"))
    ctx.fill_preserve()
    ctx.save()
    ctx.clip()
    inner = pose.get("inner")
    if inner:
        r = 0.022 if inner != "scared" else 0.03
        for k in (-1, 1):
            D.ellipse(ctx, mx + k * 0.045, my + 0.04, r, r * (0.6 if inner == "happy" else 1.0), hexrgb("#f6f0e0"),
                      None, 0)
            D.circle(ctx, mx + k * 0.045, my + 0.045, r * 0.45, ink, None, 0)
    D.col(ctx, hexrgb("#000000"), 0.35)
    ctx.set_line_width(0.008)
    for k in range(-8, 9):
        ctx.move_to(mx + k * 0.022, my - 0.05)
        ctx.line_to(mx + k * 0.022 + 0.1, my + 0.2)
        ctx.move_to(mx + k * 0.022, my - 0.05)
        ctx.line_to(mx + k * 0.022 - 0.1, my + 0.2)
    ctx.stroke()
    ctx.restore()
    D.col(ctx, ink)
    ctx.set_line_width(0.03)
    ctx.move_to(mx - 0.16, my - 0.02)
    ctx.curve_to(mx - 0.12, my + 0.1 + mo, mx + 0.12, my + 0.1 + mo, mx + 0.16, my - 0.02)
    ctx.close_path()
    ctx.stroke()
    # нос
    D.ellipse(ctx, mx + 0.04 * turn, 0.13, 0.07, 0.05, dark, None, 0)
    D.circle(ctx, mx + 0.04 * turn - 0.02, 0.115, 0.015, white, None, 0)
    # контур
    ctx.arc(0, 0, 0.5, 0, TAU)
    D.col(ctx, ink)
    ctx.set_line_width(lw * 1.2)
    ctx.stroke()
    # пот на кукле (когда внутри жарко и страшно)
    if inner == "sweat":
        for k, (x, y) in enumerate(((0.42, -0.2), (0.47, 0.05), (-0.4, -0.25))):
            D.ellipse(ctx, x, y + (pose.get("t", 0.0) * 0.4 + k * 0.3) % 0.3, 0.035, 0.05, hexrgb("#9fe0ff"), ink,
                      0.012)


# --- лицо, волосы, шапки -------------------------------------------------------

def _beard(ctx, L, turn):
    """Борода по нижней половине лица."""
    c = hexrgb(getattr(L, "beard_col", "#d9d4c8")) if isinstance(getattr(L, "beard_col", None), str) else \
        getattr(L, "beard_col", hexrgb("#d9d4c8"))
    ctx.save()
    ctx.arc(0, 0, 0.5, 0, TAU)
    ctx.clip()
    ctx.move_to(-0.52, 0.02)
    ctx.curve_to(-0.3, 0.12, -0.1 + 0.1 * turn, 0.1, 0.05 * turn, 0.14)
    ctx.curve_to(0.1 + 0.1 * turn, 0.1, 0.3, 0.12, 0.52, 0.02)
    ctx.line_to(0.52, 0.6)
    ctx.line_to(-0.52, 0.6)
    ctx.close_path()
    D.col(ctx, c)
    ctx.fill()
    ctx.restore()


def _accessories(ctx, L, e1, e2, turn):
    det = L.details
    if "sunglasses" in det or "glasses" in det:
        sun = "sunglasses" in det
        r = 0.1 if sun else 0.095
        ink = D.INK
        for (x, y) in (e1, e2):
            ctx.save()
            ctx.translate(x, y)
            ctx.scale(1.15 if sun else 1.0, 0.85 if sun else 1.0)
            ctx.arc(0, 0, r, 0, TAU)
            ctx.restore()
            if sun:
                D.col(ctx, hexrgb("#1e2230"))
                ctx.fill_preserve()
            D.col(ctx, ink)
            ctx.set_line_width(0.025)
            ctx.stroke()
            if sun:
                D.col(ctx, hexrgb("#ffffff"), 0.55)
                ctx.arc(x - 0.03, y - 0.03, 0.022, 0, TAU)
                ctx.fill()
        D.col(ctx, ink)
        ctx.set_line_width(0.025)
        ctx.move_to(e1[0] + r * (1.1 if sun else 1.0), e1[1])
        ctx.line_to(e2[0] - r * (1.1 if sun else 1.0), e2[1])
        ctx.stroke()
    if "freckles" in det:
        D.col(ctx, hexrgb("#c98a6a"), 0.7)
        for (x, y) in (e1, e2):
            for j in range(3):
                ctx.arc(x - 0.04 + j * 0.04, y + 0.1 + (j % 2) * 0.02, 0.012, 0, TAU)
                ctx.fill()


def face(ctx, L, pose, turn):
    ex = pose.get("face", "neutral")
    lx, ly = pose.get("look", (0.0, 0.0))
    bl = pose.get("blink", 0.0)
    mo = pose.get("mouth", 0.0)
    cx = 0.2 * turn
    spread = 0.15 * (1 - 0.45 * abs(turn))
    ey = -0.02
    e1 = (cx - spread + lx * 0.04, ey + ly * 0.04)
    e2 = (cx + spread + lx * 0.04, ey + ly * 0.04)
    if abs(turn) > 0.85:
        e1 = (cx + 0.02 * turn - spread * 0.9, ey + ly * 0.04)
        e2 = (cx + 0.02 * turn + spread * 0.9, ey + ly * 0.04)
    es = 0.052 * L.eye_size
    ink = D.INK
    ctx.set_line_cap(cairo.LINE_CAP_ROUND)
    if "beard" in L.details:
        _beard(ctx, L, turn)
    if L.zombie:
        sock = shade(L.head, -0.62)
        for k, (x, y) in enumerate((e1, e2)):
            r = 0.085 * L.eye_size * (1.0 + 0.12 * ((L.seed + k) % 3 - 1))
            ctx.save()
            ctx.translate(x, y)
            ctx.scale(1.0, 1.12)
            ctx.arc(0, 0, r, 0, TAU)
            ctx.restore()
            D.col(ctx, sock)
            ctx.fill()
            ctx.arc(x + 0.016 + lx * 0.02, y - 0.01, 0.026, 0, TAU)
            D.col(ctx, hexrgb("#f6f0b4"))
            ctx.fill()
        # синяки под глазами
        D.col(ctx, shade(L.head, -0.3), 0.5)
        ctx.set_line_width(0.022)
        for (x, y) in (e1, e2):
            ctx.arc(x, y + 0.03, 0.1, 0.4, math.pi - 0.4)
            ctx.stroke()
        # пятно-рана на щеке
        if L.seed % 2 == 0:
            D.col(ctx, shade(L.head, -0.25), 0.8)
            ctx.arc(cx - 0.26 * (1 if L.seed % 4 else -1), 0.14, 0.055, 0, TAU)
            ctx.fill()
        # рот с зубами
        mx = cx + 0.03 * turn
        ctx.save()
        ctx.translate(mx, 0.21)
        ctx.scale(0.07 + 0.025 * mo, 0.07 + 0.08 * mo)
        ctx.arc(0, 0, 1, 0, TAU)
        ctx.restore()
        D.col(ctx, hexrgb("#4a1a1c"))
        ctx.fill()
        if mo > 0.35:
            D.col(ctx, hexrgb("#f3efd9"))
            top = 0.21 - (0.07 + 0.08 * mo) * 0.85
            for k in (-1, 1):
                ctx.rectangle(mx + k * 0.03 - 0.016, top, 0.032, 0.035)
            ctx.fill()
        _accessories(ctx, L, e1, e2, turn)
        return
    big = ex in ("scared", "shock", "scream")
    eyes = pose.get("eyes")
    # белки для испуга
    if big and eyes != "happy":
        for (x, y) in (e1, e2):
            ctx.arc(x, y - 0.01, 0.095 * pose.get("whites", 1.0), 0, TAU)
            D.col(ctx, hexrgb("#ffffff"))
            ctx.fill_preserve()
            D.col(ctx, ink)
            ctx.set_line_width(0.022)
            ctx.stroke()
    for k, (x, y) in enumerate((e1, e2)):
        D.col(ctx, ink)
        if eyes == "happy" or (eyes is None and ex in ("happy", "laugh")):
            ctx.set_line_width(0.035)
            ctx.arc(x, y + 0.03, 0.055, math.pi + 0.3, TAU - 0.3)
            ctx.stroke()
        elif ex == "cry":
            ctx.set_line_width(0.035)
            inner = 1 if k == 0 else -1
            ctx.move_to(x - 0.05 * inner, y + 0.015)
            ctx.line_to(x + 0.05 * inner, y - 0.01)
            ctx.stroke()
        elif bl > 0.5 or ex == "sleep":
            ctx.set_line_width(0.03)
            ctx.move_to(x - 0.045, y)
            ctx.line_to(x + 0.045, y)
            ctx.stroke()
        else:
            r = es * (0.62 if big else 1.0) * pose.get("pupil", 1.0)
            ctx.save()
            ctx.translate(x + (lx * 0.03 if big else 0), y + (ly * 0.03 if big else 0))
            ctx.scale(0.85, 1.12)
            ctx.arc(0, 0, r, 0, TAU)
            ctx.restore()
            ctx.fill()
    # брови
    brow = {"sad": 0.35, "cry": 0.4, "worried": 0.3, "angry": -0.4, "determined": -0.25,
            "scared": 0.25, "scream": 0.3, "shock": 0.15}.get(ex)
    if brow is not None:
        D.col(ctx, ink)
        ctx.set_line_width(0.032)
        for k, (x, y) in enumerate((e1, e2)):
            inner = 1 if k == 0 else -1          # внутренний конец брови — к переносице
            yy = y - (0.17 if big else 0.12)
            ctx.move_to(x + 0.055 * inner, yy - brow * 0.06)
            ctx.line_to(x - 0.055 * inner, yy + brow * 0.06)
            ctx.stroke()
    # круги под глазами
    if pose.get("bags", 0) > 0:
        D.col(ctx, hexrgb("#6b5a66"), 0.55 * pose["bags"])
        ctx.set_line_width(0.028)
        for (x, y) in (e1, e2):
            ctx.arc(x, y + 0.035, 0.085, 0.35, math.pi - 0.35)
            ctx.stroke()
    # впалые щёки
    if pose.get("hollow", 0) > 0:
        D.col(ctx, ink, 0.55 * pose["hollow"])
        ctx.set_line_width(0.022)
        for k in (-1, 1):
            x = cx + k * 0.24
            ctx.move_to(x - k * 0.02, 0.1)
            ctx.curve_to(x + k * 0.02, 0.18, x + k * 0.02, 0.24, x - k * 0.03, 0.3)
            ctx.stroke()
    # рот
    mx = cx + 0.06 * turn
    my = 0.22
    # надутые щёки (рот набит)
    if pose.get("cheeks", 0) > 0:
        ck = pose["cheeks"]
        for k in (-1, 1):
            x = mx + k * 0.19
            D.col(ctx, hexrgb("#f2b8a8"), 0.7)
            ctx.arc(x, my - 0.03, 0.085 * ck, 0, TAU)
            ctx.fill()
            D.col(ctx, ink)
            ctx.set_line_width(0.022)
            ctx.arc(x, my - 0.03, 0.1 * ck, (0.2 if k > 0 else 1.9) , (1.25 if k > 0 else 2.95))
            ctx.stroke()
    # шоколад вокруг рта
    if pose.get("smear", 0) > 0:
        D.col(ctx, hexrgb("#6b3a24"), 0.85)
        for (dx, dy, rr) in ((-0.1, 0.27, 0.04), (0.08, 0.3, 0.035), (0.12, 0.2, 0.025), (-0.05, 0.33, 0.03),
                             (0.0, 0.31, 0.03)):
            ctx.arc(mx + dx * pose["smear"], my + dy - 0.22, rr, 0, TAU)
            ctx.fill()
    D.col(ctx, ink)
    D.col(ctx, ink)
    ctx.set_line_width(0.03)
    if ex in ("scream", "shock") or mo > 0.05 and ex not in ("happy",):
        op = max(mo, 0.6 if ex == "scream" else 0.35 if ex == "shock" else 0)
        ctx.save()
        ctx.translate(mx, my + 0.01)
        ctx.scale(0.06 + 0.04 * op, 0.03 + 0.11 * op)
        ctx.arc(0, 0, 1, 0, TAU)
        ctx.restore()
        D.col(ctx, hexrgb("#3a1f1c"))
        ctx.fill()
    elif ex in ("happy", "laugh"):
        ctx.arc(mx, my - 0.06, 0.09, 0.35, math.pi - 0.35)
        if ex == "laugh" or mo > 0:
            ctx.close_path()
            D.col(ctx, hexrgb("#3a1f1c"))
            ctx.fill()
        else:
            ctx.stroke()
    elif ex in ("smile",):
        ctx.arc(mx, my - 0.05, 0.07, 0.5, math.pi - 0.5)
        ctx.stroke()
    elif ex in ("sad", "cry", "worried"):
        ctx.arc(mx, my + 0.07, 0.07, math.pi + 0.55, TAU - 0.55)
        ctx.stroke()
    elif ex == "scared":
        ctx.move_to(mx - 0.06, my + 0.01)
        for k in range(1, 5):
            ctx.line_to(mx - 0.06 + k * 0.03, my + (0.02 if k % 2 else -0.01))
        ctx.stroke()
    elif ex == "eat":
        r = 0.04 + 0.04 * mo
        ctx.arc(mx, my, r, 0, TAU)
        D.col(ctx, hexrgb("#3a1f1c"))
        ctx.fill()
    else:
        ctx.move_to(mx - 0.05, my)
        ctx.line_to(mx + 0.05, my)
        ctx.stroke()
    # слёзы
    if ex == "cry" or pose.get("tears", 0) > 0:
        tp = pose.get("tears_t", 0.0)
        D.col(ctx, hexrgb("#7fb7d8"))
        for k, (x, y) in enumerate((e1, e2)):
            for j in range(2):
                ph = (tp * 0.9 + j * 0.5 + k * 0.23) % 1.0
                ty = y + 0.06 + ph * 0.32
                ctx.save()
                ctx.translate(x + 0.01, ty)
                ctx.scale(0.022, 0.034)
                ctx.arc(0, 0, 1, 0, TAU)
                ctx.restore()
                ctx.fill()
    # грязь и ссадины
    if pose.get("dirt", 0) > 0:
        dk = pose["dirt"]
        for (dx, dy, rr, c) in ((-0.3, 0.12, 0.07, "#7d6a5c"), (0.27, -0.25, 0.05, "#7d6a5c"),
                                (0.33, 0.2, 0.045, "#8a5a50"), (-0.18, -0.3, 0.035, "#7d6a5c"),
                                (0.05, 0.38, 0.05, "#7d6a5c")):
            D.col(ctx, hexrgb(c), 0.5 * dk)
            ctx.save()
            ctx.translate(cx * 0.5 + dx, dy)
            ctx.scale(1.0, 0.75)
            ctx.arc(0, 0, rr, 0, TAU)
            ctx.restore()
            ctx.fill()
        # царапина
        D.col(ctx, hexrgb("#a8473c"), 0.8 * dk)
        ctx.set_line_width(0.018)
        for j in range(3):
            ctx.move_to(cx * 0.5 - 0.36 + j * 0.03, -0.12 + j * 0.02)
            ctx.line_to(cx * 0.5 - 0.27 + j * 0.03, -0.2 + j * 0.02)
        ctx.stroke()
    # пот
    if pose.get("sweat", 0) > 0:
        sk = pose["sweat"]
        drops = ((-0.34, -0.22, 0.05, 0.3), (0.36, -0.28, 0.055, -0.2), (0.12, -0.38, 0.04, 0.0),
                 (-0.2, -0.4, 0.035, 0.2), (0.42, 0.02, 0.045, -0.3), (-0.42, 0.05, 0.04, 0.35))
        for (dx, dy, rr, a) in drops[:max(1, int(len(drops) * sk + 0.5))]:
            ctx.save()
            ctx.translate(dx, dy)
            ctx.rotate(a)
            ctx.move_to(0, -rr * 2.0)
            ctx.curve_to(rr * 0.9, -rr * 0.4, rr, rr * 0.9, 0, rr)
            ctx.curve_to(-rr, rr * 0.9, -rr * 0.9, -rr * 0.4, 0, -rr * 2.0)
            ctx.close_path()
            D.col(ctx, hexrgb("#a9d8f0"))
            ctx.fill_preserve()
            D.col(ctx, ink)
            ctx.set_line_width(0.016)
            ctx.stroke()
            D.col(ctx, hexrgb("#ffffff"), 0.9)
            ctx.arc(-rr * 0.3, -rr * 0.1, rr * 0.25, 0, TAU)
            ctx.fill()
            ctx.restore()
    if "mustache" in L.details:
        bc = getattr(L, "beard_col", "#e8e4dc")
        bc = hexrgb(bc) if isinstance(bc, str) else bc
        for k in (-1, 1):
            ctx.save()
            ctx.translate(mx + k * 0.09, my - 0.07)
            ctx.scale(k, 1)
            ctx.move_to(0.0, -0.02)
            ctx.curve_to(0.08, -0.06, 0.16, -0.03, 0.17, 0.05)
            ctx.curve_to(0.12, 0.02, 0.05, 0.04, 0.0, 0.03)
            ctx.close_path()
            D.col(ctx, bc)
            ctx.fill_preserve()
            D.col(ctx, ink)
            ctx.set_line_width(0.018)
            ctx.stroke()
            ctx.restore()
    _accessories(ctx, L, e1, e2, turn)
    # румянец
    if "blush" in L.details:
        D.col(ctx, hexrgb("#f0a29a"), 0.55)
        for (x, y) in (e1, e2):
            ctx.arc(x - 0.01 * turn, y + 0.12, 0.045, 0, TAU)
            ctx.fill()


def hair_back(ctx, L, turn, view):
    c = L.hair_col
    D.col(ctx, c)
    h = L.hair
    if h == "curly":
        for k in range(9):
            a = math.pi * (0.95 + k * 0.14)
            ctx.arc(0.53 * math.cos(a) - 0.06 * turn, 0.53 * math.sin(a) + 0.06, 0.17, 0, TAU)
            ctx.fill()
        for k in range(3):
            ctx.arc(-0.42 - 0.05 * turn, 0.1 + k * 0.14, 0.15, 0, TAU)
            ctx.fill()
            if abs(turn) < 0.6:
                ctx.arc(0.42 - 0.05 * turn, 0.1 + k * 0.14, 0.15, 0, TAU)
                ctx.fill()
    elif h == "bob":
        ctx.move_to(-0.6, 0.35)
        ctx.arc(0, -0.02, 0.6, math.pi * 0.85, math.pi * 2.15)
        ctx.line_to(0.6 - 0.25 * max(0, turn), 0.35)
        ctx.close_path()
        ctx.fill()
    elif h == "bun":
        ctx.arc(-0.22 * turn, -0.56, 0.2, 0, TAU)
        ctx.fill()
    elif h == "ponytail":
        ctx.save()
        ctx.translate(-0.5 * max(0.3, abs(turn)) * (1 if turn >= 0 else -1), -0.1)
        ctx.rotate(0.5)
        ctx.scale(0.16, 0.36)
        ctx.arc(0, 0.6, 1, 0, TAU)
        ctx.restore()
        ctx.fill()
    elif h == "pigtails":
        for sx in (-0.56, 0.56):
            if abs(turn) > 0.6 and sx * turn > 0:
                continue
            ctx.arc(sx - 0.1 * turn, 0.12, 0.14, 0, TAU)
            ctx.fill()
    elif h == "long":
        ctx.rectangle(-0.55 - 0.1 * turn, -0.1, 1.1 - 0.4 * abs(turn), 0.75)
        ctx.fill()
    elif h == "messy":
        # несколько мягких вихров на макушке
        for k, (a, ln) in enumerate(((1.18, 0.66), (1.36, 0.7), (1.55, 0.68), (1.72, 0.64))):
            a *= math.pi
            b0, b1 = a - 0.16, a + 0.16
            ctx.move_to(0.44 * math.cos(b0) - 0.04 * turn, 0.44 * math.sin(b0))
            ctx.curve_to(0.58 * math.cos(b0), 0.58 * math.sin(b0), ln * math.cos(a - 0.12), ln * math.sin(a - 0.12),
                         ln * math.cos(a + 0.1) - 0.04 * turn, ln * math.sin(a + 0.1))
            ctx.curve_to(0.55 * math.cos(b1), 0.55 * math.sin(b1), 0.46 * math.cos(b1), 0.46 * math.sin(b1),
                         0.44 * math.cos(b1) - 0.04 * turn, 0.44 * math.sin(b1))
            ctx.close_path()
            ctx.fill()
    elif h == "wild":
        for k in range(7):
            a = math.pi * (1.0 + k * 0.17)
            ctx.move_to(0.45 * math.cos(a), 0.45 * math.sin(a))
            ctx.line_to(0.75 * math.cos(a + 0.08), 0.75 * math.sin(a + 0.08))
            ctx.line_to(0.45 * math.cos(a + 0.2), 0.45 * math.sin(a + 0.2))
            ctx.fill()


def hair_front(ctx, L, turn, view):
    c = L.hair_col
    h = L.hair
    D.col(ctx, c)
    ctx.save()
    ctx.arc(0, 0, 0.505, 0, TAU)
    ctx.clip()
    if h in ("curly", "bob", "bun", "ponytail", "pigtails", "long", "short", "side", "wild", "messy"):
        if view == "back":
            ctx.rectangle(-0.6, -0.6, 1.2, 0.9 if h in ("bob", "long", "curly") else 0.55)
            ctx.fill()
        else:
            # шапка волос с чёлкой набок
            ctx.move_to(-0.6, -0.05 if h in ("bob", "long", "curly") else -0.18)
            ctx.line_to(-0.6, -0.6)
            ctx.line_to(0.6, -0.6)
            fx = 0.2 * turn
            if h == "messy":
                ctx.line_to(0.6, -0.2)
                for k in range(6):
                    xx = 0.45 - k * 0.17 + fx
                    ctx.line_to(xx, -0.36 + (0.12 if k % 2 else 0.0))
                ctx.line_to(-0.6, -0.22)
            elif h == "short":
                ctx.line_to(0.6, -0.22)
                ctx.curve_to(0.2 + fx, -0.32, -0.1 + fx, -0.26, -0.35 + fx, -0.2)
            elif h == "side":
                ctx.line_to(0.6, -0.2)
                ctx.curve_to(0.3 + fx, -0.15, 0.0 + fx, -0.36, -0.3 + fx, -0.28)
            else:
                ctx.line_to(0.6, -0.05 if abs(turn) < 0.5 else -0.25)
                ctx.curve_to(0.3 + fx, -0.25, 0.05 + fx, -0.42, -0.25 + fx, -0.3)
            ctx.close_path()
            ctx.fill()
            if h == "curly":
                D.col(ctx, shade(c, 0.12))
                for k in range(4):
                    ctx.arc(-0.3 + k * 0.18 + fx, -0.36 - (k % 2) * 0.05, 0.05, 0, TAU)
                    ctx.fill()
    elif h == "bald":
        D.col(ctx, c)
        ctx.set_line_width(0.025)
        for k in range(3):
            ctx.move_to(-0.15 + k * 0.1, -0.5)
            ctx.curve_to(-0.1 + k * 0.1, -0.62, 0.0 + k * 0.1, -0.6, 0.05 + k * 0.12, -0.48)
            ctx.stroke()
    ctx.restore()
    if h in ("curly", "bob", "bun", "ponytail", "pigtails", "long", "short", "side", "wild", "messy"):
        # контур по верху
        D.col(ctx, D.INK)
        ctx.set_line_width(0.04)
        ctx.arc(0, 0, 0.5, math.pi * 1.05, math.pi * 1.95)
        ctx.stroke()


def hat(ctx, L, turn, view, ow):
    h = L.hat
    c = L.hat_col
    ink = D.INK
    ctx.set_line_join(cairo.LINE_JOIN_ROUND)
    lw = 0.045
    if h == "propeller":
        # кепка-купол из клиньев и пропеллер
        cols = [hexrgb("#e8423c"), hexrgb("#ffd23a"), hexrgb("#2f8fd8"), hexrgb("#3fbf6a")]
        ctx.save()
        ctx.move_to(-0.5, -0.24)
        ctx.curve_to(-0.52, -0.72, 0.52, -0.72, 0.5, -0.24)
        ctx.close_path()
        ctx.save()
        ctx.clip_preserve()
        for k in range(4):
            D.col(ctx, cols[k])
            ctx.rectangle(-0.5 + k * 0.25 + 0.06 * turn, -0.8, 0.25, 0.6)
            ctx.fill()
        ctx.restore()
        D.col(ctx, ink)
        ctx.set_line_width(lw)
        ctx.stroke()
        ctx.move_to(0.0, -0.6)
        ctx.line_to(0.0, -0.74)
        ctx.stroke()
        ph = getattr(L, "prop_ph", 0.0)
        w_ = 0.28 * abs(math.cos(ph))
        D.ellipse(ctx, -w_ / 2 - 0.02, -0.76, w_ / 2 + 0.02, 0.035, hexrgb("#e8423c"), ink, 0.02)
        D.ellipse(ctx, w_ / 2 + 0.02, -0.76, w_ / 2 + 0.02, 0.035, hexrgb("#2f8fd8"), ink, 0.02)
        D.circle(ctx, 0, -0.76, 0.03, hexrgb("#ffd23a"), ink, 0.015)
        ctx.restore()
    elif h == "beanie":
        tilt = -0.06 * turn
        ctx.save()
        ctx.rotate(tilt)
        # купол
        ctx.move_to(-0.54, -0.2)
        ctx.curve_to(-0.56, -0.78, 0.56, -0.78, 0.54, -0.2)
        ctx.close_path()
        D.col(ctx, c)
        ctx.fill_preserve()
        ctx.save()
        ctx.clip()
        D.col(ctx, shade(c, -0.14))
        ctx.rectangle(-0.6, -0.8, 0.22 if turn >= 0 else 1.2, 0.8)
        ctx.fill()
        # вертикальные рубчики
        D.col(ctx, shade(c, -0.2))
        ctx.set_line_width(0.018)
        for k in range(-3, 4):
            x = k * 0.13 + 0.05 * turn
            ctx.move_to(x, -0.68)
            ctx.line_to(x * 1.05, -0.2)
            ctx.stroke()
        ctx.restore()
        D.col(ctx, ink)
        ctx.set_line_width(lw)
        ctx.stroke()
        # отворот
        D.rrect_path(ctx, -0.57, -0.38, 1.14, 0.19, 0.06)
        D.col(ctx, shade(c, -0.08))
        ctx.fill_preserve()
        D.col(ctx, ink)
        ctx.set_line_width(lw)
        ctx.stroke()
        ctx.restore()
    elif h == "guard":
        # фуражка охранника
        ctx.move_to(-0.52, -0.22)
        ctx.line_to(-0.58, -0.62)
        ctx.curve_to(-0.2, -0.78, 0.4, -0.74, 0.62, -0.58)
        ctx.line_to(0.52, -0.22)
        ctx.close_path()
        D.col(ctx, c)
        ctx.fill_preserve()
        D.col(ctx, ink)
        ctx.set_line_width(lw)
        ctx.stroke()
        D.rrect_path(ctx, -0.53, -0.32, 1.06, 0.14, 0.03)
        D.col(ctx, hexrgb("#24242c"))
        ctx.fill()
        D.col(ctx, hexrgb("#d6b24c"))
        ctx.arc(0.18 * turn, -0.45, 0.06, 0, TAU)
        ctx.fill()
        # козырёк
        bx = 0.35 * turn
        ctx.move_to(-0.35 + bx, -0.2)
        ctx.curve_to(-0.2 + bx * 1.6, -0.06, 0.25 + bx * 1.6, -0.06, 0.45 + bx * 1.2, -0.2)
        D.col(ctx, hexrgb("#24242c"))
        ctx.set_line_width(0.09)
        ctx.stroke()
    elif h == "cap":
        ctx.move_to(-0.5, -0.12)
        ctx.curve_to(-0.55, -0.72, 0.55, -0.72, 0.5, -0.12)
        ctx.close_path()
        D.col(ctx, c)
        ctx.fill_preserve()
        D.col(ctx, ink)
        ctx.set_line_width(lw)
        ctx.stroke()
        if abs(turn) > 0.2:
            sg = 1 if turn > 0 else -1
            ctx.move_to(0.3 * sg, -0.16)
            ctx.curve_to(0.6 * sg, -0.2, 0.85 * sg, -0.15, 0.9 * sg, -0.08)
            ctx.line_to(0.4 * sg, -0.08)
            ctx.close_path()
        else:
            ctx.move_to(-0.42, -0.12)
            ctx.curve_to(-0.3, 0.02, 0.3, 0.02, 0.42, -0.12)
            ctx.close_path()
        D.col(ctx, shade(c, -0.1))
        ctx.fill_preserve()
        D.col(ctx, ink)
        ctx.stroke()
    elif h == "hardhat":
        ctx.move_to(-0.5, -0.18)
        ctx.curve_to(-0.52, -0.82, 0.52, -0.82, 0.5, -0.18)
        ctx.close_path()
        D.col(ctx, c)
        ctx.fill_preserve()
        D.col(ctx, ink)
        ctx.set_line_width(lw)
        ctx.stroke()
        ctx.move_to(-0.66, -0.18)
        ctx.line_to(0.66 + 0.1 * turn, -0.18)
        ctx.set_line_width(0.09)
        D.col(ctx, shade(c, -0.15))
        ctx.stroke()
    elif h == "crown":
        D.col(ctx, c)
        for k in range(7):
            a = math.pi * (1.1 + k * 0.13)
            x0, y0 = 0.42 * math.cos(a), 0.42 * math.sin(a) - 0.05
            x1, y1 = 0.78 * math.cos(a), 0.78 * math.sin(a) - 0.12
            ctx.move_to(x0 - 0.06, y0)
            ctx.line_to(x1, y1)
            ctx.line_to(x0 + 0.06, y0)
            ctx.close_path()
            ctx.fill_preserve()
            D.col(ctx, ink)
            ctx.set_line_width(0.025)
            ctx.stroke()
            D.col(ctx, c)
        D.rrect_path(ctx, -0.5, -0.42, 1.0, 0.16, 0.05)
        ctx.fill_preserve()
        D.col(ctx, ink)
        ctx.set_line_width(0.03)
        ctx.stroke()
    elif h == "helmet":
        ctx.move_to(-0.56, -0.08)
        ctx.curve_to(-0.6, -0.8, 0.6, -0.8, 0.56, -0.08)
        ctx.close_path()
        D.col(ctx, c)
        ctx.fill_preserve()
        D.col(ctx, ink)
        ctx.set_line_width(lw)
        ctx.stroke()
    elif h == "headband":
        D.col(ctx, c)
        ctx.rectangle(-0.52, -0.32, 1.04, 0.1)
        ctx.fill()
    elif h == "captain":
        # белая тулья, чёрный околыш, козырёк, золотая кокарда
        big = getattr(L, "hat_big", 1.0)
        ctx.save()
        ctx.scale(big, big)
        ctx.translate(0, -0.04 * (big - 1) * 4)
        ctx.move_to(-0.5, -0.3)
        ctx.curve_to(-0.75, -0.55, -0.6, -0.74, 0.0, -0.76)
        ctx.curve_to(0.6, -0.74, 0.78, -0.55, 0.52, -0.3)
        ctx.close_path()
        D.col(ctx, c)
        ctx.fill_preserve()
        D.col(ctx, ink)
        ctx.set_line_width(lw)
        ctx.stroke()
        D.rrect_path(ctx, -0.5, -0.38, 1.0, 0.17, 0.03)
        D.col(ctx, hexrgb("#20232e"))
        ctx.fill_preserve()
        D.col(ctx, ink)
        ctx.set_line_width(0.03)
        ctx.stroke()
        D.col(ctx, hexrgb("#e3b84a"))
        ctx.rectangle(-0.48, -0.25, 0.96, 0.03)
        ctx.fill()
        bx = 0.15 * turn
        ctx.arc(bx, -0.43, 0.09, 0, TAU)
        ctx.fill()
        D.col(ctx, hexrgb("#20232e"))
        ctx.set_line_width(0.02)
        ctx.move_to(bx, -0.49)
        ctx.line_to(bx, -0.37)
        ctx.move_to(bx - 0.04, -0.4)
        ctx.curve_to(bx - 0.03, -0.36, bx + 0.03, -0.36, bx + 0.04, -0.4)
        ctx.stroke()
        # козырёк
        vx = 0.35 * turn
        ctx.move_to(-0.38 + vx, -0.22)
        ctx.curve_to(-0.2 + vx * 1.5, -0.08, 0.3 + vx * 1.5, -0.08, 0.48 + vx * 1.2, -0.22)
        D.col(ctx, hexrgb("#20232e"))
        ctx.set_line_width(0.1)
        ctx.stroke()
        ctx.restore()
    elif h == "toque":
        D.col(ctx, c)
        pts = [(-0.4, -0.32), (-0.55, -0.7), (-0.42, -1.0), (-0.15, -1.1), (0.12, -1.12), (0.4, -1.0),
               (0.55, -0.7), (0.4, -0.32)]
        D.catmull(ctx, pts, closed=True)
        ctx.fill_preserve()
        D.col(ctx, ink)
        ctx.set_line_width(lw)
        ctx.stroke()
        D.rrect_path(ctx, -0.44, -0.42, 0.88, 0.18, 0.04)
        D.col(ctx, c)
        ctx.fill_preserve()
        D.col(ctx, ink)
        ctx.stroke()
    elif h in ("sunhat", "bucket"):
        wide = 0.95 if h == "sunhat" else 0.66
        ctx.move_to(-0.42, -0.28)
        ctx.curve_to(-0.46, -0.78, 0.46, -0.78, 0.42, -0.28)
        ctx.close_path()
        D.col(ctx, c)
        ctx.fill_preserve()
        D.col(ctx, ink)
        ctx.set_line_width(lw)
        ctx.stroke()
        D.col(ctx, getattr(L, "hat_band", hexrgb("#c23b33")))
        ctx.rectangle(-0.44, -0.4, 0.88, 0.1)
        ctx.fill()
        D.ellipse(ctx, 0.05 * turn, -0.27, wide, 0.09, c, ink, lw)
    elif h == "visor":
        D.col(ctx, c)
        ctx.rectangle(-0.52, -0.36, 1.04, 0.1)
        ctx.fill()
        sg = 1 if turn >= 0 else -1
        if abs(turn) > 0.2:
            ctx.move_to(0.3 * sg, -0.28)
            ctx.curve_to(0.6 * sg, -0.3, 0.85 * sg, -0.25, 0.9 * sg, -0.18)
            ctx.line_to(0.4 * sg, -0.2)
            ctx.close_path()
        else:
            D.ellipse(ctx, 0, -0.22, 0.42, 0.08, None, None, 0)
        D.col(ctx, shade(c, -0.1))
        ctx.fill_preserve()
        D.col(ctx, ink)
        ctx.set_line_width(0.03)
        ctx.stroke()
    elif h == "headset":
        D.col(ctx, hexrgb("#2b2f3a"))
        ctx.set_line_width(0.07)
        ctx.arc(0, -0.05, 0.56, math.pi * 1.08, math.pi * 1.92)
        ctx.stroke()
        side_ = -1 if turn < 0.4 else 1
        ex = -0.5 if abs(turn) < 0.4 else -0.12 * side_
        D.ellipse(ctx, ex, 0.0, 0.1, 0.14, hexrgb("#2b2f3a"), ink, 0.025)
        ctx.set_line_width(0.035)
        ctx.move_to(ex, 0.1)
        ctx.curve_to(ex + 0.1, 0.3, 0.1 + 0.2 * turn, 0.3, 0.18 + 0.15 * turn, 0.24)
        ctx.stroke()
        ctx.arc(0.18 + 0.15 * turn, 0.24, 0.035, 0, TAU)
        ctx.fill()


# --- готовые персонажи -------------------------------------------------------

# Лео — 17 лет, помощник официанта: белая рубашка, чёрный жилет, красная бабочка, лохматые волосы
LEO = Look(name="leo", head="#f6eee2", body="#f7f4ec", hair="messy", hair_col="#2a2220",
           details=("waiter", "bowtie"), seed=1)
LEO_CAP = Look(**{**LEO.__dict__, "name": "leo_cap", "hat": "captain", "hat_col": "#fbfaf5", "hat_big": 1.08})
LEO_VEST = Look(**{**LEO_CAP.__dict__, "name": "leo_vest", "details": ("waiter", "bowtie", "lifevest")})
CAPTAIN = Look(name="captain", head="#f3e6d6", body="#f7f5ee", hat="captain", hat_col="#fbfaf5",
               hair="short", hair_col="#cfcac0", details=("epaulettes", "beard"), seed=2, scale=1.05)
CAPTAIN_Z = Look(name="captain_z", head="#86c94a", body="#eeece2", hair="short", hair_col="#bdb8ad",
                 details=("epaulettes", "beard", "stains"), zombie=True, seed=2, scale=1.05)
DOLORES = Look(name="dolores", head="#ecd2bb", body="#e8669a", body2="#ffe36a", hair="curly", hair_col="#f1efe9",
               hat="headset", details=("hawaiian", "glasses", "blush"), scale=0.9, seed=5)
MOM = Look(name="mom", head="#f3dfca", body="#3fb1a8", hair="bun", hair_col="#5a3a26",
           details=("scrubs",), seed=6)
MAX = Look(name="max", head="#f6e8d6", body="#f2c230", body2="#3f7fd0", hair="messy", hair_col="#6b4428",
           details=("stripes", "freckles"), scale=0.68, head_scale=1.1, seed=7)
GUARD = Look(name="guard", head="#f0dcc6", body="#2f5f9e", hat="cap", hat_col="#2f5f9e",
             details=("polo", "lifevest"), seed=8)
PASSENGERS = [  # живые пассажиры в первый день
    dict(head="#f3dcc4", body="#3fa3d9", body2="#ffe36a", hair="short", hair_col="#5a3a26", details=("hawaiian",)),
    dict(head="#e9c7a6", body="#f2783a", hair="bob", hair_col="#2a2220", details=("tanktop",)),
    dict(head="#f6e2cc", body="#e8669a", style="dress", length=0.3, hair="long", hair_col="#c9a25a",
         hat="sunhat", hat_col="#f2dca0", details=("sunglasses",)),
    dict(head="#d9b08c", body="#27a37a", hair="curly", hair_col="#2a2220", details=("trunks",)),
    dict(head="#f3dcc4", body="#ffffff", hair="bald", hair_col="#8a7a6a", details=("robe",)),
    dict(head="#c99a78", body="#f7d23a", hair="short", hair_col="#2a2220", hat="visor", hat_col="#ffffff",
         details=("polo", "sunglasses")),
]

MANNEQUIN = dict(head="#e9dcc6", limb=hexrgb("#8a7a68"), faceless=True)

# сочный зелёный
ZOMBIE_SKIN = ["#86c94a", "#7cc03f", "#93d158", "#6fbb3a", "#9bd666", "#82c650", "#74c048"]
HAWAII = [("#e8423c", "#ffe36a"), ("#2f8fd8", "#ffffff"), ("#16a39a", "#ff9ac2"), ("#f2a03a", "#3fb1a8"),
          ("#7a4fc2", "#ffd84a"), ("#f05a8a", "#ffffff")]
BRIGHT = ["#e8423c", "#2f8fd8", "#f2c230", "#16a39a", "#f2783a", "#7a4fc2", "#f05a8a", "#3fbf6a", "#1d6fd8",
          "#ff9a3c"]


# --- аэропорт -------------------------------------------------------------------

# Дэнни — 18 лет, грузчик багажа: тёмно-синяя футболка, оранжевый жилет нараспашку, тёмные кудри
DANNY = Look(name="danny", head="#c98d63", body="#26375c", hair="curly", hair_col="#2a1d18",
             details=("hivis",), seed=11)
# с седьмого дня — кожаная куртка пилота с «крылышками»
DANNY_JACKET = Look(**{**DANNY.__dict__, "name": "danny_jacket", "body2": hexrgb("#8a5a34"),
                       "details": ("jacket", "wings")})
DANNY_PILOT = Look(**{**DANNY_JACKET.__dict__, "name": "danny_pilot", "hat": "headset"})
# Уолт — 72, командир авиалайнера на пенсии: седые усы, очки-авиаторы, кожанка, кепка
WALT = Look(name="walt", head="#e6c3a0", body="#f2eee4", body2=hexrgb("#7a4a2a"), hair="short",
            hair_col="#ece8e0", hat="cap", hat_col="#3a5f8a", beard_col="#f0ece4",
            details=("jacket", "mustache", "sunglasses"), girth=1.12, seed=12)
# Бабушка Джун — Канзас: седой пучок, сиреневая кофта, очки
JUNE = Look(name="june", head="#f0d6bf", body="#f6efe2", body2=hexrgb("#a884cf"), hair="bun",
            hair_col="#ebe8e2", details=("jacket", "glasses", "blush"), scale=0.88, seed=13)
# --- Starfall Park --------------------------------------------------------------
FUR_GREY = "#9a9ea6"
RASCAL = Look(name="rascal", head=FUR_GREY, body="#e8423c", fur=FUR_GREY, mascot_head="raccoon", tail="raccoon",
              head_scale=1.55, neck_len=-0.14, girth=1.5, details=("starshirt",), seed=31)
RASCAL_PATCH = Look(**{**RASCAL.__dict__, "name": "rascal_patch", "details": ("starshirt", "patch")})
RASCAL_RIP = Look(**{**RASCAL.__dict__, "name": "rascal_rip", "details": ("starshirt", "rip")})
# герой без головы костюма (мех на теле, своя голова)
THEO_FUR = Look(name="theo_fur", head="#f3d6bd", body="#e8423c", fur=FUR_GREY, tail="raccoon", girth=1.45,
                hair="messy", hair_col="#c4622d", details=("starshirt", "freckles"), seed=31)
THEO_FUR_PATCH = Look(**{**THEO_FUR.__dict__, "name": "theo_fur_patch", "details": ("starshirt", "freckles", "patch")})
# герой без костюма: футболка парка, шорты
THEO = Look(name="theo", head="#f3d6bd", body="#e8423c", hair="messy", hair_col="#c4622d",
            details=("starshirt", "freckles"), seed=31)
GUS = Look(name="gus", head="#ecc9a8", body="#f2c230", style="coat", length=0.1, hair="short", hair_col="#ece8e0",
           hat="beanie", hat_col="#2b3550", beard_col="#f0ece4", details=("beard", "glasses"), girth=1.15, seed=41)
LILY = Look(name="lily", head="#f3d6bd", body="#f08cb0", style="dress", length=0.15, hair="pigtails",
            hair_col="#c4622d", details=("freckles",), scale=0.6, head_scale=1.12, seed=51)
VISITORS = [  # живые посетители в первый день
    dict(head="#f3dcc4", body="#3fa3d9", body2="#ffe36a", hair="short", hair_col="#5a3a26", details=("hawaiian",)),
    dict(head="#e9c7a6", body="#f2783a", hair="bob", hair_col="#2a2220", details=("tanktop", "sunglasses")),
    dict(head="#f6e2cc", body="#e8669a", style="dress", length=0.3, hair="long", hair_col="#c9a25a",
         hat="sunhat", hat_col="#f2dca0", details=("sunglasses",)),
    dict(head="#d9b08c", body="#27a37a", hair="curly", hair_col="#2a2220", hat="cap", hat_col="#e8423c"),
    dict(head="#f3dcc4", body="#7a4fc2", hair="pigtails", hair_col="#6b4428", scale=0.62, head_scale=1.1,
         hat="propeller"),
    dict(head="#c99a78", body="#f7d23a", hair="short", hair_col="#2a2220", hat="visor", hat_col="#ffffff",
         details=("polo", "sunglasses")),
]


def park_zombie(seed, kind=None):
    """Зомби Starfall Park: туристы, семьи, дети в кепках с пропеллером, подростки, работники в
    полосатых рубашках, операторы аттракционов, повара фуд-корта, бабушки в панамах."""
    import random
    r = random.Random(seed)
    kinds = ["tourist", "tourist", "dad", "dad", "mom", "kid", "kid", "teen", "teen", "staff", "operator", "chef",
             "grandma", "tourist", "dad", "kid"]
    k = kind or r.choice(kinds)
    kw = dict(head=r.choice(ZOMBIE_SKIN), body=r.choice(BRIGHT), zombie=True, seed=seed,
              scale=r.uniform(0.92, 1.06), details=("stains",))
    kw["hair"] = r.choice([None, "short", "side", "bob", "bun", "bald", "long", "wild", "curly", "messy"])
    kw["hair_col"] = r.choice(["#3a2a24", "#6b4a33", "#a8a39a", "#2a2522", "#c27a3a", "#e0c070", "#2a2522"])
    if k == "tourist":
        kw.update(details=("sunglasses", "stains") if r.random() < 0.6 else ("stains", "torn"),
                  hat=r.choice(["bucket", "visor", "cap", "sunhat"]),
                  hat_col=r.choice(["#f2dca0", "#ffffff", "#e8423c", "#2f8fd8"]))
    elif k == "dad":
        kw.update(details=("hawaiian", "stains") if r.random() < 0.6 else ("polo", "stains"), girth=r.uniform(1.0, 1.3),
                  hat=r.choice([None, "cap", "visor"]), hat_col=r.choice(["#2f8fd8", "#e8423c", "#2a2522"]),
                  hair=r.choice(["short", "bald", "side"]))
    elif k == "mom":
        kw.update(style=r.choice(["dress", "shirt"]), length=0.25, details=("sunglasses", "stains"),
                  hair=r.choice(["bun", "ponytail", "bob", "long"]), hat=r.choice([None, "sunhat"]),
                  hat_col="#f2dca0")
    elif k == "kid":
        kw.update(body2=hexrgb("#fbfaf4"), details=("stripes", "stains"), scale=0.62, head_scale=1.1,
                  hair=r.choice(["messy", "pigtails", "short", "curly"]), hat=r.choice(["propeller", None, "cap"]),
                  hat_col=r.choice(["#e8423c", "#2f8fd8"]))
    elif k == "teen":
        kw.update(details=("tanktop", "sunglasses", "stains") if r.random() < 0.5 else ("stains", "torn"),
                  hair=r.choice(["messy", "long", "wild", "side"]), scale=r.uniform(0.95, 1.05),
                  hat=r.choice([None, "beanie", "cap"]), hat_col=r.choice(["#2a2522", "#7a4fc2"]))
    elif k == "staff":
        kw.update(body="#e8423c", details=("staffstripes", "nametag", "stains"), hat="visor", hat_col="#e8423c",
                  hair=r.choice(["short", "ponytail", "bob"]))
    elif k == "operator":
        kw.update(body="#2f8fd8", details=("polo", "lanyard", "nametag", "stains"), hat=r.choice(["cap", None]),
                  hat_col="#2f8fd8")
    elif k == "chef":
        kw.update(body="#fbfaf4", details=("chef", "stains"), hat="toque", hat_col="#fbfaf4", girth=r.uniform(1.0, 1.25))
    elif k == "grandma":
        kw.update(style="dress", length=0.45, body="#f2eee4", body2=hexrgb(r.choice(["#a884cf", "#e8669a", "#5aa0c8"])),
                  details=("glasses", "stains"), hair="curly", hair_col="#e9e6df", hat=r.choice(["sunhat", None]),
                  hat_col="#f2dca0", scale=r.uniform(0.86, 0.94))
    return Look(**kw)


PILLOWS = ["#f2c230", "#e8423c", "#2f8fd8", "#9a6ad0", "#3fbf6a", "#f08cb0", "#ff9a3c"]


def zombie_look(seed, kind=None):
    """Зомби аэропорта: пассажиры с подушками на шее, бизнесмены, пижамы, экипаж, досмотр."""
    import random
    r = random.Random(seed)
    kinds = ["traveler", "traveler", "traveler", "business", "business", "pajamas", "attendant", "pilot", "tsa",
             "ramp", "tourist", "tourist", "kid", "grandma", "traveler", "business"]
    k = kind or r.choice(kinds)
    kw = dict(head=r.choice(ZOMBIE_SKIN), body=r.choice(BRIGHT), zombie=True, seed=seed,
              scale=r.uniform(0.92, 1.06), details=("stains",), pillow_col=r.choice(PILLOWS))
    kw["hair"] = r.choice([None, "short", "side", "bob", "bun", "bald", "long", "wild", "curly", "messy"])
    kw["hair_col"] = r.choice(["#3a2a24", "#6b4a33", "#a8a39a", "#2a2522", "#c27a3a", "#e0c070", "#2a2522"])
    if k == "traveler":
        kw.update(body=r.choice(BRIGHT), details=("neckpillow", "stains") if r.random() < 0.7 else ("stains", "torn"),
                  hat=r.choice([None, None, "cap", "beanie"]), hat_col=r.choice(["#2f8fd8", "#e8423c", "#2a2522"]))
    elif k == "business":
        kw.update(body="#f4f4f0", body2=hexrgb(r.choice(["#3a4252", "#2b3550", "#4a4a4a", "#5a4632"])),
                  details=("suit", "stains"), hair=r.choice(["short", "side", "bald", "bob"]))
    elif k == "pajamas":
        kw.update(body=r.choice(["#9fc8f0", "#f2a8c8", "#b8e0a0", "#f6d68a"]), body2=hexrgb("#fbfaf4"),
                  details=("stripes", "neckpillow", "stains"), hair=r.choice(["messy", "wild", "bun"]))
    elif k == "attendant":
        if r.random() < 0.6:
            kw.update(style="dress", length=0.3, body="#1f3557", details=("scarf", "nametag", "stains"),
                      hair=r.choice(["bun", "bob"]))
        else:
            kw.update(body="#1f3557", body2=hexrgb("#c23b33"), details=("tie", "nametag", "stains"),
                      hair=r.choice(["short", "side"]))
    elif k == "pilot":
        kw.update(body="#f7f5ee", details=("epaulettes", "stains"), hair=r.choice(["short", "side", "bald"]),
                  hat=r.choice(["captain", None]), hat_col="#24304a")
    elif k == "tsa":
        kw.update(body="#5f7fa8", details=("polo", "badge", "nametag", "stains"), hair=r.choice(["short", "bun"]))
    elif k == "ramp":
        kw.update(body="#26375c", details=("hivis", "stains"), hat=r.choice(["beanie", "cap", None]),
                  hat_col=r.choice(["#2a2522", "#f2c230"]))
    elif k == "tourist":
        kw.update(body=r.choice(BRIGHT), details=("neckpillow", "sunglasses", "stains"),
                  hat=r.choice(["bucket", "visor", "cap"]), hat_col=r.choice(["#f2dca0", "#ffffff", "#e8423c"]))
    elif k == "kid":
        kw.update(body=r.choice(BRIGHT), body2=hexrgb("#fbfaf4"), details=("stripes", "stains"), scale=0.62,
                  head_scale=1.1, hair=r.choice(["messy", "pigtails", "short", "curly"]))
    elif k == "grandma":
        kw.update(style="dress", length=0.45, body="#f2eee4", body2=hexrgb(r.choice(["#a884cf", "#e8669a", "#5aa0c8"])),
                  details=("jacket", "glasses", "neckpillow"), hair="curly", hair_col="#e9e6df",
                  scale=r.uniform(0.86, 0.94))
    return Look(**kw)
