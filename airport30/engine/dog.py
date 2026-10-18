"""Собаки сбоку: щенок корги (по умолчанию) и лабрадор (p["lab"]): длинные лапы, висячие уши,
хвост-«выдра», синяя жилетка K-9 (p["vest"]) и наушники (p["headset"])."""
import math
import cairo
from .core import hexrgb, shade, TAU, clamp, noise1
from . import draw as D

FUR = hexrgb("#d98a3d")
FUR_D = hexrgb("#b86f2c")
WHITE = hexrgb("#f6efe2")
LEG = D.INK


def dog_pose(t, mode="stand", phase=0.0, wag=1.0, bark=0.0, look=0.0, **kw):
    p = dict(mode=mode, t=t, phase=phase, wag=wag, bark=bark, look=look)
    p.update(kw)
    return p


def draw_dog(ctx, x, gy, s, f, p, alpha=1.0):
    """x, gy — точка на земле под центром тела; s — пикселей на u (как у людей)."""
    t = p.get("t", 0.0)
    mode = p.get("mode", "stand")
    ph = p.get("phase", 0.0) % 1.0
    ctx.save()
    ctx.translate(x, gy)
    ctx.scale(f * s, s)
    lw = max(0.07, 1.4 / s)
    # параметры тела
    lab = p.get("lab", False)
    body_y = -0.52 - (0.26 if lab else 0.0)
    tilt = 0.0
    hop = 0.0
    if mode == "trot":
        hop = -0.03 * abs(math.sin(TAU * ph))
    if mode == "run":
        hop = -0.12 * max(0, math.sin(TAU * ph))
        tilt = 0.08 * math.sin(TAU * ph)
    if mode == "sit":
        tilt = -0.42
        body_y = -0.5 - (0.22 if lab else 0.0)
    if mode == "jump":
        j = p.get("jump", 0.0)
        hop = -1.2 * math.sin(math.pi * clamp(j))
        tilt = -0.3 * math.cos(math.pi * clamp(j))
    if mode == "lie":
        body_y = -0.28 - (0.04 if lab else 0.0)
    ctx.translate(0, body_y + hop)
    ground = -(body_y + hop)          # земля в координатах тела (до поворота)
    ct, st_ = math.cos(tilt), math.sin(tilt)

    def R_(px, py):
        return px * ct - py * st_, px * st_ + py * ct

    # лапы: (x на теле, фаза); первые две — ближние
    legs = [(0.32, 0.0), (-0.36, 0.5), (0.26, 0.5), (-0.42, 0.0)]
    for i, (lx, off) in enumerate(legs):
        far = i >= 2
        c = shade(LEG, 0.25) if far else LEG
        top = R_(lx, 0.12)
        if mode in ("trot", "run"):
            q = (ph + off) % 1.0
            amp = 0.16 if mode == "trot" else 0.3
            if q < 0.55:
                s_ = q / 0.55
                fx, fy = amp * (0.5 - s_), 0.0
            else:
                s_ = (q - 0.55) / 0.45
                fx, fy = amp * (-0.5 + s_), -0.12 * math.sin(math.pi * s_)
            foot = (top[0] + fx, ground + fy)
        elif mode == "sit":
            foot = (top[0] + (0.06 if lx > 0 else 0.28), ground if lx > 0 else ground - 0.02)
        elif mode == "lie":
            foot = (top[0] + 0.25, ground)
        elif mode == "jump":
            j = p.get("jump", 0.0)
            tuck = math.sin(math.pi * clamp(j))
            foot = (top[0] + (0.2 if lx > 0 else -0.2) * tuck, top[1] + 0.4 - 0.2 * tuck)
        else:
            foot = (top[0] + (0.02 if far else 0.0), ground)
        if mode == "sit" and lx < 0:
            knee = (top[0] + 0.22, top[1] + 0.05)
        else:
            knee = ((top[0] + foot[0]) / 2 + (0.04 if lx > 0 else -0.04), (top[1] + foot[1]) / 2)
        D.col(ctx, c)
        ctx.set_line_width(lw * 1.25)
        ctx.set_line_cap(cairo.LINE_CAP_ROUND)
        ctx.set_line_join(cairo.LINE_JOIN_ROUND)
        ctx.move_to(*top)
        ctx.line_to(*knee)
        ctx.line_to(*foot)
        ctx.stroke()
        ctx.move_to(foot[0], foot[1])
        ctx.line_to(foot[0] + 0.07, foot[1])
        ctx.stroke()
    ctx.rotate(tilt)
    # хвост
    wag = p.get("wag", 1.0)
    tw = math.sin(t * 18) * 0.5 * wag
    ctx.save()
    ctx.translate(-0.55, -0.12)
    ctx.rotate(-0.9 + tw)
    if lab:
        ctx.move_to(0, 0)
        ctx.curve_to(-0.05, -0.2, 0.0, -0.38, 0.08 + 0.1 * tw, -0.5)
        D.col(ctx, D.INK)
        ctx.set_line_width(lw * 2.4)
        ctx.set_line_cap(cairo.LINE_CAP_ROUND)
        ctx.stroke_preserve()
        D.col(ctx, FUR)
        ctx.set_line_width(lw * 1.5)
        ctx.stroke()
    else:
        D.ellipse(ctx, 0, -0.1, 0.07, 0.14, FUR, D.INK, lw * 0.7)
    ctx.restore()
    # туловище
    D.ellipse(ctx, 0, 0, 0.62, 0.3, FUR, None, 0)
    ctx.save()
    ctx.translate(0, 0)
    ctx.scale(0.62, 0.3)
    ctx.arc(0, 0, 1, 0, TAU)
    ctx.restore()
    ctx.save()
    ctx.clip()
    D.col(ctx, WHITE)
    D.ellipse(ctx, 0.1, 0.3, 0.55, 0.16, WHITE, None, 0)
    D.col(ctx, FUR_D)
    ctx.rectangle(-0.7, -0.4, 1.4, 0.1)
    ctx.fill()
    ctx.restore()
    if p.get("vest"):
        ctx.save()
        ctx.scale(0.62, 0.3)
        ctx.arc(0, 0, 1, 0, TAU)
        ctx.restore()
        ctx.save()
        ctx.clip()
        D.rect(ctx, -0.34, -0.4, 0.62, 0.8, hexrgb("#2f6fd0"), None, 0, wob=0)
        D.rect(ctx, -0.34, -0.4, 0.62, 0.07, hexrgb("#ffd23a"), None, 0, wob=0)
        ctx.restore()
        ctx.save()
        ctx.scale(f, 1)
        ctx.select_font_face(D.FONT_TITLE)
        ctx.set_font_size(0.16)
        D.col(ctx, hexrgb("#fff6d8"))
        ctx.move_to(-0.18 * f - (0.0 if f > 0 else 0.1), 0.06)
        ctx.show_text("K-9")
        ctx.restore()
    D.ellipse(ctx, 0, 0, 0.62, 0.3, None, D.INK, lw * 0.75)
    # голова
    bark = p.get("bark", 0.0)
    look = p.get("look", 0.0)
    hb = 0.04 * math.sin(t * 30) * bark
    ctx.save()
    ctx.translate(0.5, -0.32 + hb)
    ctx.rotate(-0.1 * bark + look * 0.2)
    # уши
    if p.get("floppy"):
        for ex, c in ((-0.12, FUR_D), (0.02, FUR)):
            D.ellipse(ctx, ex, 0.02, 0.1, 0.24, c, D.INK, lw * 0.7, rot=0.25)
    for ex, c in (() if p.get("floppy") else ((-0.05, FUR_D), (0.08, FUR))):
        ctx.move_to(ex - 0.12, -0.12)
        ctx.line_to(ex - 0.04, -0.48)
        ctx.line_to(ex + 0.1, -0.14)
        ctx.close_path()
        D.col(ctx, c)
        ctx.fill_preserve()
        D.col(ctx, D.INK)
        ctx.set_line_width(lw * 0.7)
        ctx.stroke()
    D.circle(ctx, 0, 0, 0.28, FUR, D.INK, lw * 0.75)
    if lab:
        # длинная морда лабрадора
        D.ellipse(ctx, 0.3, 0.07, 0.19, 0.13, FUR, D.INK, lw * 0.7)
        D.ellipse(ctx, 0.3, 0.1, 0.14, 0.07, WHITE, None, 0)
        D.circle(ctx, 0.0, 0.0, 0.265, FUR, None, 0)
        D.ellipse(ctx, 0.47, 0.02, 0.05, 0.045, D.INK, None, 0)
        if p.get("floppy"):
            D.ellipse(ctx, -0.15, 0.05, 0.085, 0.18, FUR_D, D.INK, lw * 0.7, rot=0.2)
    else:
        # морда
        ctx.save()
        ctx.arc(0, 0, 0.28, 0, TAU)
        ctx.clip()
        D.ellipse(ctx, 0.18, 0.12, 0.2, 0.15, WHITE, None, 0)
        D.ellipse(ctx, 0.02, -0.02, 0.05, 0.16, WHITE, None, 0)
        ctx.restore()
        # нос, рот
        D.ellipse(ctx, 0.27, 0.05, 0.12, 0.09, WHITE, D.INK, lw * 0.7)
        D.circle(ctx, 0.37, 0.0, 0.04, D.INK, None, 0)
    if bark > 0.05:
        op = 0.5 + 0.5 * math.sin(t * 30)
        ctx.move_to(0.12, 0.1)
        ctx.line_to(0.36, 0.08 + 0.02)
        ctx.line_to(0.3, 0.12 + 0.1 * op)
        ctx.close_path()
        D.col(ctx, hexrgb("#6a2a24"))
        ctx.fill()
    # глаз
    bl = 1.0 if (t * 0.9 + 0.3) % 3.7 < 0.1 else 0.0
    if bl:
        D.line(ctx, 0.06, -0.06, 0.14, -0.06, D.INK, lw * 0.5)
    else:
        D.ellipse(ctx, 0.1, -0.06, 0.04, 0.05, D.INK, None, 0)
        D.circle(ctx, 0.115, -0.08, 0.013, (1, 1, 1), None, 0)
    if p.get("headset"):
        D.col(ctx, hexrgb("#2b2f3a"))
        ctx.set_line_width(0.06)
        ctx.arc(-0.02, -0.02, 0.33, math.pi * 1.05, math.pi * 1.95)
        ctx.stroke()
        D.ellipse(ctx, -0.04, -0.02, 0.12, 0.15, hexrgb("#2b2f3a"), D.INK, lw * 0.6)
        D.ellipse(ctx, -0.04, -0.02, 0.06, 0.08, hexrgb("#e8423c"), None, 0)
    ctx.restore()
    ctx.restore()
