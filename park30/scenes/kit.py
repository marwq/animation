"""Общий инструментарий сцен: ходьба, толпы зомби, лазание по лестнице, кошка на руках,
позы (сидя, вис на тарзанке, гидроцикл), комиксовые надписи и линии скорости."""
import math
import random
import cairo

from engine.core import (W, H, FPS, TAU, Keys, clamp, lerp, inv_lerp, remap, ease_io, ease_in, ease_out, smooth,
                         ease_out_back, ease_io3, hexrgb, mix, shade, noise1, fbm, rng, win, pulse)
from engine import draw as D
from engine import rig as R
from engine import fx
from engine.film import Cam, layer, Shot, bg, cached, blit
from engine.cat import draw_cat, cat_pose
from engine import overlay as O
from engine.raccoon import draw_raccoon, raccoon_pose, raccoon_head
from sets import sea as SEA, park as PK, rides as RD, balloon as BL, castle as CA, inside as IN, lake as LK
from sets.base import tone
from sets.park import star

RASCAL = R.Fig(R.RASCAL)
RASCAL_PATCH = R.Fig(R.RASCAL_PATCH)
RASCAL_RIP = R.Fig(R.RASCAL_RIP)
THEO = R.Fig(R.THEO)
THEO_FUR = R.Fig(R.THEO_FUR)
THEO_FUR_PATCH = R.Fig(R.THEO_FUR_PATCH)
GUS = R.Fig(R.GUS)
LILY = R.Fig(R.LILY)


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
        m.look = R.park_zombie(m.seed, r.choice(kinds) if kinds else None)
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


# --- лазание по лестнице ------------------------------------------------------------------

RUNG = 0.45     # шаг перекладин в u


def climb_pose(progress, view="back", face="determined", seed=0, reach=2.55):
    """Поза лазания. progress — сколько u пройдено вверх. Возвращает (поза, подъём в u).

    Пары конечностей: (левая нога + правая рука) и (правая нога + левая рука) переставляются
    по очереди на две перекладины вверх; тело поднимается плавно.
    """
    step = 2 * RUNG
    c = progress / step
    n, fr = math.floor(c), c - math.floor(c)
    fa = n * step + step * smooth(clamp(fr * 2))
    fb = n * step + RUNG + step * smooth(clamp(fr * 2 - 1)) - step * 0.0
    lift = progress
    p = R.stand(view, 0, seed)
    side = view == "side"
    fx_ = 0.28 if side else 0.15
    hx_ = 0.42 if side else 0.3
    # локальная «земля» = подъём тела; стопы на перекладинах
    p["f1"] = (fx_ if side else -fx_, lift - fa)
    p["f2"] = (fx_ if side else fx_, lift - fb)
    p["h2"] = (hx_ if side else hx_, lift - (fa + reach))
    p["h1"] = (hx_ if side else -hx_, lift - (fb + reach))
    p.update(face=face, hip=(0.0, 0.18), lean=0.05 if side else 0.0, hturn=0.6 if side else 0.0)
    if side:
        p.update(f1=(fx_ + 0.03, lift - fa), f2=(fx_ - 0.03, lift - fb))
    return p


def draw_climber(ctx, fig, x, base_y, s, progress, f=1, view="back", face="determined", seed=0, extra=None,
                 alpha=1.0):
    """Рисует лезущего вверх: base_y — уровень пола у основания лестницы."""
    p = climb_pose(progress, view, face, seed)
    return fig.draw(ctx, x, base_y - progress * s * fig.look.scale, s, f, p, alpha, extra)


# --- позы ---------------------------------------------------------------------------------

def sit_pose(t=0.0, seed=0, face="neutral", view="side", seat=0.95, feet_x=0.55):
    """Сидя на стуле высотой seat (u): таз ниже, колени вперёд."""
    p = R.stand(view, t, seed)
    p.update(hip=(0.0, seat * 0.0 + (R.HIP_H - seat)), face=face)
    if view == "side":
        p.update(f1=(feet_x, 0.0), f2=(feet_x - 0.08, 0.0), a1=(0.35, 0.6), a2=(0.25, 0.7))
    else:
        p.update(f1=(-0.25, 0.0), f2=(0.25, 0.0))
    return p


def floor_sit_pose(t=0.0, seed=0, face="neutral", hug=False):
    """Сидя на полу, колени вверх (вид сбоку)."""
    p = R.stand("side", t, seed)
    p.update(hip=(0.0, R.HIP_H - 0.12), f1=(0.75, 0.0), f2=(0.68, 0.0), face=face, lean=-0.05)
    if hug:
        p.update(h1=(0.62, -0.82), h2=(0.58, -0.78))
    else:
        p.update(a1=(0.2, 0.4), a2=(-0.3, 0.3))
    return p


def hang_pose(t=0.0, swing=0.0, face="scream"):
    """Вис на тарзанке: руки вверх, ноги болтаются."""
    p = R.stand("side", t, 1)
    sw = math.sin(t * 5) * 0.2 + swing
    p.update(h1=(0.05, -3.75), h2=(-0.05, -3.72), k1=(0.25 + sw, 0.5), k2=(-0.1 - sw, 0.35), face=face, lean=-0.05)
    return p


def jetski_pose(t=0.0, face="laugh"):
    """Верхом на гидроцикле: колени согнуты, руки на руле."""
    p = R.stand("side", t, 1)
    p.update(hip=(0.0, 0.62), f1=(0.45, 0.0), f2=(0.4, 0.0), h1=(0.85, -2.25), h2=(0.8, -2.2), lean=0.12,
             face=face)
    return p


def pushup_pose(k, face="determined"):
    """Отжимание, k 0..1 (0 — руки прямые). Фигура горизонтальна: рисовать с поворотом."""
    p = R.stand("side", 0, 1)
    bend = 0.25 + 1.2 * k
    p.update(face=face, a1=(1.57 - bend * 0.3, bend), a2=(1.5 - bend * 0.3, bend), hturn=0.9)
    return p


# --- кошка на руках -------------------------------------------------------------------------

def hold_cat(fig, x, gy, s, f, J, t, which=("hand1", "hand2"), scale=0.9, vest=False, meow=0.0, hat=False):
    """Мировая точка между кистями — туда «подмышками» вешается кошка."""
    a = fig.world(x, gy, s, f, J[which[0]])
    b = fig.world(x, gy, s, f, J[which[1]])
    return ((a[0] + b[0]) / 2, (a[1] + b[1]) / 2 - s * 0.08), cat_pose(t, "held", vest=vest, meow=meow, hat=hat)


def draw_held_cat(ctx, fig, x, gy, s, f, J, t, **kw):
    (cx, cy), p = hold_cat(fig, x, gy, s, f, J, t, **kw)
    draw_cat(ctx, cx, cy, s * kw.get("scale", 0.9), f, p)


# --- комиксовые эффекты ---------------------------------------------------------------------

def pop_text(ctx, txt, x, y, t, t0, size=150, c="#fff6d8", rot=-0.08, dur=0.9, shake=True, stroke=None):
    """Звукоподражание: выпрыгивает с отскоком, дрожит и гаснет."""
    k = t - t0
    if k < 0 or k > dur:
        return
    sc = ease_out_back(clamp(k / 0.15)) * (1 + 0.04 * math.sin(k * 40) if shake else 1)
    a = clamp((dur - k) / 0.2)
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(rot)
    ctx.scale(sc, sc)
    D.text(ctx, txt, 8, 10, size, D.FONT_TITLE, D.INK, alpha=a * 0.5, stroke=D.INK, slw=size * 0.12)
    D.text(ctx, txt, 0, 0, size, D.FONT_TITLE, hexrgb(c), alpha=a, stroke=stroke or D.INK, slw=size * 0.1)
    ctx.restore()


def speed_lines(ctx, t, cx=W / 2, cy=H / 2, n=40, a=0.5, r0=420, seed=3, c="#ffffff"):
    """Радиальные линии скорости по краям кадра."""
    r = rng(seed)
    D.col(ctx, c, a)
    for i in range(n):
        ang = r.uniform(0, TAU) + math.sin(t * 20 + i) * 0.01
        L = r.uniform(200, 600)
        rr = r0 + r.uniform(0, 300) + (t * 1500 + i * 97) % 200
        w = r.uniform(3, 9)
        ctx.set_line_width(w)
        ctx.move_to(cx + math.cos(ang) * rr, cy + math.sin(ang) * rr)
        ctx.line_to(cx + math.cos(ang) * (rr + L), cy + math.sin(ang) * (rr + L))
        ctx.stroke()


def motion_lines(ctx, x, y, dirx, n=4, L=120, gap=26, c="#ffffff", a=0.8, w=6):
    """Горизонтальные линии движения позади объекта (dirx — направление движения)."""
    for k in range(n):
        yy = y + (k - (n - 1) / 2) * gap
        x0 = x - dirx * (40 + (k % 2) * 30)
        D.line(ctx, x0, yy, x0 - dirx * L * (0.6 + 0.4 * ((k * 7) % 3) / 2), yy, hexrgb(c), w, a)


def impact(ctx, x, y, k, r=120, c="#fff6d8"):
    """Звезда удара (k 0..1)."""
    if not 0 <= k <= 1:
        return
    pts = []
    for i in range(16):
        a = i * TAU / 16
        rr = r * (1.0 if i % 2 == 0 else 0.5) * (0.6 + 0.4 * ease_out(k))
        pts.append((x + math.cos(a) * rr, y + math.sin(a) * rr))
    D.poly(ctx, pts, hexrgb(c), D.INK, 5, wob=0, alpha=1 - k)


def sweat(ctx, x, y, t, s=1.0, n=3, seed=0):
    r = rng(seed)
    for i in range(n):
        ph = (t * 1.5 + i / n) % 1
        a = r.uniform(-2.4, -0.7)
        px = x + math.cos(a) * (40 + 60 * ph) * s
        py = y + math.sin(a) * (40 + 60 * ph) * s + 80 * ph * ph * s
        D.ellipse(ctx, px, py, 9 * s, 13 * s, hexrgb("#a9d8f0"), D.INK, 2.5, alpha=1 - ph)


def zombie_glow_eyes(ctx, x, y, s, a=1.0):
    for k in (-1, 1):
        fx.glow(ctx, x + k * s * 0.55, y, s * 2.4, "#c8ff80", 0.25 * a)
        D.ellipse(ctx, x + k * s * 0.55, y, s * 0.32, s * 0.24, "#efffc8", None, 0, alpha=a)


# --- бигль Бисквит (собака Долорес) ------------------------------------------------------

from engine import dog as _DOG
from engine.dog import dog_pose


def draw_beagle(ctx, x, gy, s, f, p):
    keep = (_DOG.FUR, _DOG.FUR_D, _DOG.WHITE)
    _DOG.FUR, _DOG.FUR_D, _DOG.WHITE = hexrgb("#c8843a"), hexrgb("#2a2220"), hexrgb("#fbf4e8")
    p = dict(p)
    p["floppy"] = True
    try:
        _DOG.draw_dog(ctx, x, gy, s, f, p)
    finally:
        _DOG.FUR, _DOG.FUR_D, _DOG.WHITE = keep


def draw_lab(ctx, x, gy, s, f, p):
    """Пиклз — палевый лабрадор в синей жилетке K-9."""
    keep = (_DOG.FUR, _DOG.FUR_D, _DOG.WHITE)
    _DOG.FUR, _DOG.FUR_D, _DOG.WHITE = hexrgb("#ecc47e"), hexrgb("#cf9b52"), hexrgb("#f8ead0")
    p = dict(p)
    p.setdefault("floppy", True)
    p.setdefault("lab", True)
    p.setdefault("vest", True)
    try:
        _DOG.draw_dog(ctx, x, gy, s, f, p)
    finally:
        _DOG.FUR, _DOG.FUR_D, _DOG.WHITE = keep


def draw_parrot(ctx, x, y, s, f=1, t=0.0, talk=0.0, fly=0.0):
    """Попугай Роджер: зелёный, жёлтая голова, красное плечо. (x, y) — лапы; s — высота птицы в px."""
    ctx.save()
    ctx.translate(x, y)
    ctx.scale(f * s / 100.0, s / 100.0)
    G, G2, Y, RD = hexrgb("#3fae4a"), hexrgb("#2b8a38"), hexrgb("#f2d23a"), hexrgb("#e8423c")
    lw = 4
    # хвост
    D.poly(ctx, [(-22, -30), (-48, 18), (-36, 22), (-14, -24)], G2, D.INK, lw, wob=0)
    D.poly(ctx, [(-40, 10), (-48, 18), (-36, 22)], hexrgb("#2f6fd0"), None, 0, wob=0)
    # тело
    D.ellipse(ctx, 0, -46, 26, 36, G, D.INK, lw, rot=-0.35)
    # крыло
    flap = math.sin(t * 22) * fly
    ctx.save()
    ctx.translate(-4, -58)
    ctx.rotate(-0.4 - 1.1 * max(0.0, flap) * fly)
    D.ellipse(ctx, -6, 14, 14, 26, G2, D.INK, lw)
    D.ellipse(ctx, -4, -2, 9, 8, RD, None, 0)
    ctx.restore()
    # голова
    D.circle(ctx, 14, -84, 19, Y, D.INK, lw)
    D.circle(ctx, 18, -88, 6.5, (1, 1, 1), D.INK, 2.5)
    D.circle(ctx, 20, -88, 3.2, D.INK, None, 0)
    # клюв
    op = talk * (0.5 + 0.5 * math.sin(t * 25))
    D.poly(ctx, [(28, -92), (44, -86), (40, -72), (30, -78)], hexrgb("#e8d9b8"), D.INK, 3, wob=0)
    D.poly(ctx, [(29, -76 + op * 2), (38, -70 + op * 8), (28, -68 + op * 8)], hexrgb("#d8c8a6"), D.INK, 3, wob=0)
    # лапы
    if fly <= 0:
        D.line(ctx, -4, -14, -6, 0, D.INK, 4)
        D.line(ctx, 6, -14, 8, 0, D.INK, 4)
    ctx.restore()


def suitcase(ctx, x, y, s=1.0, c="#2f8fd8", ang=0.0, handle=True):
    """Чемодан на колёсиках: (x, y) — низ, s — масштаб (1 ≈ 120 px)."""
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(ang)
    ctx.scale(s, s)
    c = hexrgb(c) if isinstance(c, str) else c
    if handle:
        D.line(ctx, -18, -110, -18, -150, D.INK, 6)
        D.line(ctx, 18, -110, 18, -150, D.INK, 6)
        D.line(ctx, -22, -150, 22, -150, D.INK, 8)
    D.rrect(ctx, -40, -112, 80, 104, 12, c, D.INK, 5)
    for k in (-1, 1):
        D.line(ctx, k * 16, -104, k * 16, -16, shade(c, -0.2), 4)
    D.circle(ctx, -26, -4, 7, hexrgb("#2b2f3a"), D.INK, 3)
    D.circle(ctx, 26, -4, 7, hexrgb("#2b2f3a"), D.INK, 3)
    ctx.restore()


def diag_split(ctx, left_fn, right_fn, k=1.0, x_top=1060, x_bot=860):
    """Экран, разрезанный наискосок: k 0..1 — насколько выехала правая половина."""
    off = (1 - ease_out(clamp(k))) * (W - min(x_top, x_bot) + 80)
    ctx.save()
    D.path(ctx, [(0, 0), (x_top + off, 0), (x_bot + off, H), (0, H)])
    ctx.clip()
    left_fn(ctx)
    ctx.restore()
    ctx.save()
    D.path(ctx, [(x_top + off, 0), (W + 10, 0), (W + 10, H), (x_bot + off, H)])
    ctx.clip()
    ctx.translate(off, 0)
    right_fn(ctx)
    ctx.restore()
    D.line(ctx, x_top + off, -10, x_bot + off, H + 10, D.INK, 22)
    D.line(ctx, x_top + off, -10, x_bot + off, H + 10, hexrgb("#fff6d8"), 9)
