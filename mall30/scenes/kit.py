"""Общий инструментарий сцен: ходьба по траектории, толпы зомби, позы, свет."""
import math
import random
import cairo

from engine.core import (W, H, FPS, TAU, Keys, clamp, lerp, inv_lerp, remap, ease_io, ease_in, ease_out, smooth,
                         ease_out_back, ease_io3, hexrgb, mix, shade, noise1, fbm, rng, win, pulse)
from engine import draw as D
from engine import rig as R
from engine import fx
from engine.film import Cam, layer, Shot, bg, cached, blit
from engine.dog import draw_dog, dog_pose
from engine import overlay as O
from sets import common as C, city as CITY, mall as M

HERO = R.Fig(R.HERO)
GUS = R.Fig(R.GUS)
GUS_Z = R.Fig(R.GUS_Z)
ROSA = R.Fig(R.ROSA)
MOM = R.Fig(R.MOM)
LILY = R.Fig(R.LILY)
SOLDIER = R.Fig(R.SOLDIER)
LIBERTY = R.Fig(R.LIBERTY)


# --- ходьба без проскальзывания --------------------------------------------------

class Walk:
    """Движение по ключам x(t) (и, при желании, y(t) и масштаба s(t)).

    Фаза цикла = пройденный путь в u / длину цикла, поэтому стопа, стоящая на земле,
    неподвижна относительно пола при любой скорости.
    """

    def __init__(self, x, y=None, s=80.0, kind="walk", t0=0.0, t1=60.0, view="side", face=None, seed=0,
                 stop_pose=None):
        self.x = x if callable(x) else (lambda t, v=x: v)
        self.y = y if callable(y) else (lambda t, v=y: v)
        self.s = s if callable(s) else (lambda t, v=s: v)
        self.kind, self.view, self.face, self.seed = kind, view, face, seed
        self.stop_pose = stop_pose
        self.t0, self.t1 = t0, t1
        n = int((t1 - t0) * 120) + 2
        self.ts = [t0 + i / 120 for i in range(n)]
        self.d = [0.0]
        for i in range(1, n):
            a, b = self.ts[i - 1], self.ts[i]
            dx = self.x(b) - self.x(a)
            dy = (self.y(b) - self.y(a)) if self.y(a) is not None else 0.0
            dist = math.hypot(dx, dy * 0.0 if view == "side" else dy)
            self.d.append(self.d[-1] + dist / max(self.s(b), 1e-3))

    def dist(self, t):
        t = clamp(t, self.t0, self.t1)
        f = (t - self.t0) * 120
        i = int(f)
        if i >= len(self.d) - 1:
            return self.d[-1]
        return self.d[i] + (self.d[i + 1] - self.d[i]) * (f - i)

    def speed(self, t):
        """Скорость в u/с."""
        return (self.dist(t + 0.05) - self.dist(t - 0.05)) / 0.1

    def facing(self, t):
        if self.face is not None:
            return self.face(t) if callable(self.face) else self.face
        dx = self.x(t + 0.05) - self.x(t - 0.05)
        if abs(dx) < 0.01:
            # смотрим туда, куда шли
            for k in range(1, 40):
                dx = self.x(t - k * 0.05) - self.x(t - k * 0.05 - 0.05)
                if abs(dx) > 0.01:
                    break
        return 1 if dx >= 0 else -1

    def pose(self, t, extra=None):
        g = R.GAITS[self.kind]
        v = self.speed(t)
        cyc = g["L"]
        ph = self.dist(t) / cyc
        walk = R.gait(ph, self.kind, self.view, self.seed)
        vref = cyc * 0.9
        w = clamp(v / (vref * 0.35))
        if w < 1:
            st = self.stop_pose(t) if self.stop_pose else (
                zombie_idle(t, self.seed, self.view) if self.kind == "shamble" else R.stand(self.view, t, self.seed))
            p = R.blend(st, walk, smooth(w))
        else:
            p = walk
        if extra:
            p = dict(p)
            p.update(extra)
        return p

    def draw(self, ctx, fig, t, extra=None, f=None, dy=0.0, alpha=1.0, props=None):
        p = self.pose(t, extra)
        return fig.draw(ctx, self.x(t), self.y(t) + dy, self.s(t), f if f is not None else self.facing(t), p,
                        alpha, props)


def zombie_idle(t, seed=0, view="side"):
    """Зомби стоит: покачивается, голова набок, руки висят чуть вперёд."""
    sw = math.sin(t * 1.3 + seed) * 0.05
    p = R.stand(view, t, seed)
    p.update(lean=0.12 + sw, neck=0.25 + 0.08 * math.sin(t * 0.9 + seed * 2), htilt=0.15 * math.sin(seed),
             mouth=0.3 + 0.3 * max(0, math.sin(t * 2 + seed)))
    if view == "side":
        p.update(a1=(0.5 + sw, -0.2), a2=(0.35 - sw, -0.1), f1=(0.12, 0), f2=(-0.1, 0))
    else:
        p.update(a1=(0.12 + sw * 0.5, -0.1), a2=(0.18 - sw * 0.5, -0.05))
    return p


def zombie_reach(t, seed=0):
    """Руки вперёд, тянется."""
    p = zombie_idle(t, seed)
    w = math.sin(t * 3 + seed) * 0.08
    p.update(a1=(1.35 + w, -0.2), a2=(1.2 - w, -0.1), lean=0.22, mouth=0.6 + 0.3 * math.sin(t * 5 + seed))
    return p


# --- толпа --------------------------------------------------------------------

class Member:
    __slots__ = ("look", "fig", "x", "y", "s", "f", "seed", "vx", "kind", "ph0", "lod")


def make_crowd(seed, n, x0, x1, y0, y1, s0, s1, vx=(0.0, 0.0), face=None, kinds=None):
    """Толпа: y0 — дальний ряд (масштаб s0), y1 — ближний (s1)."""
    r = random.Random(seed)
    out = []
    for i in range(n):
        m = Member()
        m.seed = seed * 1000 + i
        m.look = R.zombie_look(m.seed, r.choice(kinds) if kinds else None)
        m.fig = R.Fig(m.look)
        m.y = r.uniform(y0, y1)
        k = (m.y - y0) / max(1e-6, (y1 - y0))
        m.s = lerp(s0, s1, k) * r.uniform(0.95, 1.05)
        m.x = r.uniform(x0, x1)
        m.vx = r.uniform(*vx)
        m.f = face if face is not None else (1 if r.random() < 0.5 else -1)
        if m.vx:
            m.f = 1 if m.vx > 0 else -1
        m.kind = "shamble"
        m.ph0 = r.random()
        out.append(m)
    out.sort(key=lambda m: m.y)
    return out


def fast_zombie(ctx, x, gy, s, f, look, t, seed, moving):
    """Упрощённая фигура для дальнего плана."""
    sw = math.sin(t * 2 + seed) * 0.08
    hip = gy - 1.62 * s
    top = hip - 1.06 * s
    lw = max(1.4, 0.11 * s)
    D.col(ctx, D.INK)
    ctx.set_line_width(lw)
    ctx.set_line_cap(cairo.LINE_CAP_ROUND)
    st = (math.sin(t * 5 + seed) * 0.25 * s) if moving else 0.08 * s
    ctx.move_to(x - 0.05 * s, hip)
    ctx.line_to(x - 0.05 * s - st, gy)
    ctx.move_to(x + 0.05 * s, hip)
    ctx.line_to(x + 0.05 * s + st, gy)
    ctx.move_to(x, top + 0.1 * s)
    ctx.line_to(x + f * 0.55 * s, top + (0.25 + sw) * s)
    ctx.stroke()
    D.col(ctx, look.body)
    ctx.rectangle(x - 0.22 * s, top, 0.44 * s, (1.2 + look.length) * s)
    ctx.fill()
    D.col(ctx, look.head)
    ctx.arc(x + f * 0.05 * s, top - 0.62 * s, 0.5 * s, 0, TAU)
    ctx.fill_preserve()
    D.col(ctx, D.INK)
    ctx.set_line_width(max(1.0, 0.05 * s))
    ctx.stroke()
    if s > 9:
        D.col(ctx, D.INK)
        for ex in (-0.13, 0.13):
            ctx.arc(x + f * 0.05 * s + ex * s + f * 0.08 * s, top - 0.64 * s, 0.07 * s, 0, TAU)
            ctx.fill()


def draw_crowd(ctx, members, t, pose_fn=None, lod=22.0, dx=0.0, filt=None):
    for m in members:
        if filt and not filt(m):
            continue
        x = m.x + m.vx * t + dx
        moving = abs(m.vx) > 1
        if m.s < lod:
            fast_zombie(ctx, x, m.y, m.s, m.f, m.look, t, m.seed, moving)
            continue
        if pose_fn:
            p = pose_fn(m, t)
        elif moving:
            dist_u = abs(m.vx) * t / m.s
            p = R.gait(m.ph0 + dist_u / R.GAITS["shamble"]["L"], "shamble", "side", m.seed)
        else:
            p = zombie_idle(t, m.seed % 97)
        m.fig.draw(ctx, x, m.y, m.s, m.f, p)


# --- разное ---------------------------------------------------------------------

def depth_s(y, horizon, ref_y, ref_s):
    """Масштаб фигуры по глубине: на линии ref_y масштаб ref_s."""
    return ref_s * (y - horizon) / (ref_y - horizon)


def shake_k(t, t0, dur=0.5, amp=1.0):
    if t < t0 or t > t0 + dur:
        return 0.0
    return amp * (1 - (t - t0) / dur)


def flashlight_beam(ctx, x, y, ang, length=700, spread=0.28, alpha=0.18):
    """Видимый луч фонаря (поверх темноты)."""
    ctx.save()
    ctx.set_operator(cairo.OPERATOR_ADD)
    g = cairo.RadialGradient(x, y, 0, x, y, length)
    g.add_color_stop_rgba(0, 1, 0.95, 0.8, alpha)
    g.add_color_stop_rgba(1, 1, 0.95, 0.8, 0)
    ctx.set_source(g)
    ctx.move_to(x, y)
    ctx.arc(x, y, length, ang - spread, ang + spread)
    ctx.close_path()
    ctx.fill()
    ctx.restore()


def hold_flashlight(J, ctx, which="hand1", ang=0.0, on=True):
    hx, hy = J[which]
    ctx.save()
    ctx.translate(hx, hy)
    ctx.rotate(ang)
    D.rrect(ctx, -0.05, -0.05, 0.34, 0.1, 0.03, hexrgb("#3a3a40"), D.INK, 0.03)
    D.rect(ctx, 0.27, -0.07, 0.08, 0.14, hexrgb("#f4e7b0") if on else hexrgb("#777"), D.INK, 0.025, wob=0)
    ctx.restore()


def mop(ctx, J, which="hand1", other="hand2"):
    """Швабра в руках (локальные координаты персонажа)."""
    hx, hy = J[which]
    ox, oy = J[other]
    dx, dy = hx - ox, hy - oy
    L = math.hypot(dx, dy) or 1
    ux, uy = dx / L, dy / L
    top = (ox - ux * 0.5, oy - uy * 0.5)
    bot = (hx + ux * 1.4, hy + uy * 1.4)
    D.line(ctx, *top, *bot, hexrgb("#a5764a"), 0.07)
    D.line(ctx, *top, *bot, D.INK, 0.02)
    ctx.save()
    ctx.translate(*bot)
    ctx.rotate(math.atan2(uy, ux) - math.pi / 2)
    for k in range(-3, 4):
        D.line(ctx, k * 0.04, 0, k * 0.06, 0.28, hexrgb("#d9d2c2"), 0.05)
    ctx.restore()


def ground_shadow(ctx, x, y, w, a=0.18):
    D.ellipse(ctx, x, y, w, w * 0.16, (0.1, 0.07, 0.05), None, 0, alpha=a)


def text_card(ctx, lines, t, bgc="#f3e7d0"):
    """Инфографика: строки появляются по очереди. lines: [(текст, размер, цвет, y, t_появления)]."""
    D.col(ctx, bgc)
    ctx.paint()
    for txt, size, colr, y, ta in lines:
        k = clamp((t - ta) / 0.3)
        if k <= 0:
            continue
        sc = ease_out_back(k)
        ctx.save()
        ctx.translate(W / 2, y)
        ctx.scale(sc, sc)
        D.text(ctx, txt, 0, 0, size, D.FONT_TITLE, hexrgb(colr), alpha=k)
        ctx.restore()
