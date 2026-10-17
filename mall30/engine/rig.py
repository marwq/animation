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
                sx, sy = rot(-0.25 if i == 1 else 0.25, sh_y, lean)
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
        nx, ny = rot(0, -NECK - 0.5 * L.head_scale, lean + neck)
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
        lw = max(LIMB_W, 1.6 / s)
        ow = max(OUT_W, 1.1 / s)
        if alpha < 1:
            ctx.push_group()
        limb = L.limb
        far = mix(limb, (0.42, 0.37, 0.35), 0.18)
        if extra:
            extra(ctx, J, "back")
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

    def _torso(self, ctx, J, ow, f):
        L = self.look
        hip, lean, view = J["hip"], J["lean"], J["view"]
        side = view == "side"
        wt, wb = (0.38, 0.44) if side else (0.56, 0.60)
        ext = 0.14 + L.length
        if L.style in ("coat", "dress"):
            wb += 0.12 + L.length * (0.35 if L.style == "dress" else 0.18)
        pts = [(-wt / 2, -TORSO), (wt / 2, -TORSO), (wb / 2, ext), (-wb / 2, ext)]
        # скругление плеч
        ctx.save()
        ctx.translate(*hip)
        ctx.rotate(lean)
        r = 0.09
        ctx.move_to(-wt / 2, -TORSO + r)
        ctx.arc(-wt / 2 + r, -TORSO + r, r, math.pi, 1.5 * math.pi)
        ctx.arc(wt / 2 - r, -TORSO + r, r, 1.5 * math.pi, 2 * math.pi)
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
        ctx.close_path()
        D.col(ctx, L.body)
        ctx.fill_preserve()
        ctx.save()
        ctx.clip_preserve()
        # тень на спине
        D.col(ctx, shade(L.body, -0.18))
        bx = -wb / 2 if side else wb / 2 - 0.12
        ctx.rectangle(bx - 0.02, -TORSO - 0.1, 0.13, TORSO + ext + 0.4)
        ctx.fill()
        self._details(ctx, wt, wb, ext, side, f)
        ctx.restore()
        D.col(ctx, D.INK)
        ctx.set_line_width(ow)
        ctx.set_line_join(cairo.LINE_JOIN_ROUND)
        ctx.stroke()
        ctx.restore()

    def _details(self, ctx, wt, wb, ext, side, f):
        L = self.look
        det = L.details
        cx = 0.04 if side else 0.0
        if "vest" in det:   # светоотражающий жилет
            D.col(ctx, hexrgb("#e8853a"))
            ctx.rectangle(-0.4, -TORSO, 0.8, TORSO + ext)
            ctx.fill()
            D.col(ctx, hexrgb("#f1e9c8"))
            ctx.rectangle(-0.4, -0.62, 0.8, 0.09)
            ctx.rectangle(-0.4, -0.3, 0.8, 0.09)
            ctx.fill()
        if "apron" in det:
            D.col(ctx, L.body2 or hexrgb("#f1e9d8"))
            ctx.rectangle(-0.17 + cx, -0.75, 0.34, 0.9)
            ctx.fill()
        if "stripes" in det:
            D.col(ctx, L.body2 or shade(L.body, -0.2))
            for k in range(4):
                ctx.rectangle(-0.4, -TORSO + 0.2 + k * 0.28, 0.8, 0.1)
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
            ctx.rectangle(-0.4, -0.08, 0.8, 0.08)
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
        if "jacket" in det:   # куртка поверх
            D.col(ctx, L.body2 or shade(L.body, -0.15))
            ctx.rectangle(-0.4, -TORSO, 0.4 if not side else 0.18, TORSO + ext)
            ctx.fill()
            if not side:
                ctx.rectangle(0.07, -TORSO, 0.4, TORSO + ext)
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
        ctx.restore()


# --- лицо, волосы, шапки -------------------------------------------------------

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
    if L.zombie:
        for k, (x, y) in enumerate((e1, e2)):
            ctx.arc(x, y, 0.085 * L.eye_size, 0, TAU)
            D.col(ctx, hexrgb("#2b2522"))
            ctx.fill()
            ctx.arc(x + 0.018 + lx * 0.02, y - 0.012, 0.022, 0, TAU)
            D.col(ctx, hexrgb("#e9e4d6"))
            ctx.fill()
        # рот
        mx = cx + 0.03 * turn
        D.col(ctx, hexrgb("#2b2522"))
        ctx.save()
        ctx.translate(mx, 0.21)
        ctx.scale(0.065 + 0.02 * mo, 0.075 + 0.07 * mo)
        ctx.arc(0, 0, 1, 0, TAU)
        ctx.restore()
        ctx.fill()
        return
    big = ex in ("scared", "shock", "scream")
    # белки для испуга
    if big:
        for (x, y) in (e1, e2):
            ctx.arc(x, y - 0.01, 0.095, 0, TAU)
            D.col(ctx, hexrgb("#ffffff"))
            ctx.fill_preserve()
            D.col(ctx, ink)
            ctx.set_line_width(0.022)
            ctx.stroke()
    for k, (x, y) in enumerate((e1, e2)):
        D.col(ctx, ink)
        if ex in ("happy", "laugh"):
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
            r = es * (0.62 if big else 1.0)
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
    # рот
    mx = cx + 0.06 * turn
    my = 0.22
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
    if h in ("curly", "bob", "bun", "ponytail", "pigtails", "long", "short", "side", "wild"):
        if view == "back":
            ctx.rectangle(-0.6, -0.6, 1.2, 0.9 if h in ("bob", "long", "curly") else 0.55)
            ctx.fill()
        else:
            # шапка волос с чёлкой набок
            ctx.move_to(-0.6, -0.05 if h in ("bob", "long", "curly") else -0.18)
            ctx.line_to(-0.6, -0.6)
            ctx.line_to(0.6, -0.6)
            fx = 0.2 * turn
            if h == "short":
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
    if h in ("curly", "bob", "bun", "ponytail", "pigtails", "long", "short", "side", "wild"):
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
    if h == "beanie":
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


# --- готовые персонажи -------------------------------------------------------

HERO = Look(name="hero", head="#f6f1e6", body="#34466b", hat="beanie", hat_col="#e2a33b",
            details=("nametag", "pocket", "belt"), seed=1)
GUS = Look(name="gus", head="#f2ece0", body="#4b5563", hat="guard", hat_col="#3d4452",
           details=("badge", "pocket", "belt"), scale=1.04, seed=2)
GUS_Z = Look(name="gus_z", head="#a8b29c", body="#4b5563", hat="guard", hat_col="#3d4452",
             details=("badge", "pocket", "belt", "stains"), zombie=True, scale=1.04, seed=3)
ROSA = Look(name="rosa", head="#f6efe2", body="#c4473a", hair="curly", hair_col="#3a2722",
            details=("blush",), seed=4)
MOM = Look(name="mom", head="#f6efe2", body="#7a9a8c", hair="bun", hair_col="#6b4a33",
           details=("apron",), body2="#efe4cf", seed=5)
LILY = Look(name="lily", head="#f7f1e6", body="#e9b94a", hair="pigtails", hair_col="#6b4a33",
            details=("blush",), scale=0.72, head_scale=1.08, seed=6)
SOLDIER = Look(name="soldier", head="#f1e9dc", body="#6b6f4a", hat="helmet", hat_col="#5b5f3c",
               details=("pocket", "belt"), seed=7)
LIBERTY = Look(name="liberty", head="#9fb59e", body="#6fa79a", style="dress", length=0.55, hat="crown",
               hat_col="#6fa79a", zombie=True, details=("torn",), seed=8)

MANNEQUIN = dict(head="#e9dcc6", limb=hexrgb("#8a7a68"), faceless=True)

ZOMBIE_SKIN = ["#a8b29c", "#9fab98", "#b1b7a2", "#a3a99a", "#aab4a4", "#98a593"]
ZOMBIE_CLOTH = ["#d7b44a", "#5f8f8a", "#c9b79a", "#8f7fa3", "#b56a5a", "#6f7f9a", "#9a8f6a", "#c7c2b3",
                "#7b8f6a", "#a87b5a", "#596173", "#d08a5a"]


def zombie_look(seed, kind=None):
    import random
    r = random.Random(seed)
    kinds = ["suit", "tee", "coat", "dress", "vest", "tourist", "jogger", "plain", "plain", "coat", "tee"]
    k = kind or r.choice(kinds)
    kw = dict(head=r.choice(ZOMBIE_SKIN), body=r.choice(ZOMBIE_CLOTH), zombie=True, seed=seed,
              scale=r.uniform(0.92, 1.06), details=("stains",))
    hairs = [None, None, "short", "side", "bob", "bun", "bald", "long", "wild", "curly"]
    kw["hair"] = r.choice(hairs)
    kw["hair_col"] = r.choice(["#3a2a24", "#6b4a33", "#8b8b80", "#2a2522", "#9a6a3a", "#c9b07a"])
    if k == "suit":
        kw.update(body=r.choice(["#3e4454", "#4a4a4a", "#5a5446"]), details=("tie", "stains", "torn"),
                  body2=r.choice(["#9b3b34", "#3b5a9b", "#8a7a3b"]), hair=r.choice(["short", "side", "bald"]))
    elif k == "coat":
        kw.update(style="coat", length=r.uniform(0.3, 0.6), details=("stains", "torn"))
    elif k == "dress":
        kw.update(style="dress", length=r.uniform(0.3, 0.6), details=("torn", "stains"),
                  hair=r.choice(["bob", "long", "bun", "curly"]))
    elif k == "vest":
        kw.update(details=("vest", "stains"), hat="hardhat", hat_col="#e8c13a", hair=None)
    elif k == "tourist":
        kw.update(body="#f0ece0", details=("iloveny", "stains", "torn"), hat=r.choice([None, "cap"]),
                  hat_col="#c23b33")
    elif k == "jogger":
        kw.update(body=r.choice(["#d0605a", "#5a8fd0", "#e0c050"]), hat="headband", hat_col="#f0ece0",
                  details=("stripes", "stains"), body2="#f0ece0")
    elif k == "tee":
        kw.update(details=("stains", "torn"))
    return Look(**kw)
