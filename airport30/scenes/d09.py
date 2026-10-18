"""День 9: у Уолта новости — на тридцатый день карантинную зону закроют навсегда. Ни машин, ни лодок,
ни самолётов. «Тогда я улечу». — «Ты не умеешь летать, сынок». — «Тогда научи». Долгая тишина.
«Роджер дэт», — говорит попугай."""
from scenes.kit import *
from scenes.shared import *


def shot_news(ctx, t, S):
    d = S.cue(1) - 0.1
    T_MAP = d * 0.35
    if t < T_MAP:
        cam = Cam(OS.RADIO_X - 240, 520, 1.6)
        walt_radio(ctx, t, cam, 1.0, "worried")
        return
    tt = t - T_MAP
    D.rect(ctx, 0, 0, W, H, tone("#28402c", "night"), None, 0, wob=0)
    map_view(ctx, tt, W / 2, H / 2 + 40, 0.15, "night", labels=False)
    k = ease_out(clamp(tt / 0.8))
    R0 = 420
    D.circle(ctx, W / 2, H / 2 + 40, R0 * k, None, hexrgb("#e8423c"), 14)
    for i in range(40):
        a = i / 40 * TAU
        D.radial(ctx, W / 2 + math.cos(a) * R0 * k, H / 2 + 40 + math.sin(a) * R0 * k, 40, "#ffe9a0", 0.6 * k, 0)
    D.text(ctx, "QUARANTINE ZONE", W / 2, H / 2 + 40 + R0 * k + 80, 60, D.FONT_TITLE, hexrgb("#e8423c"),
           stroke=D.INK, slw=6, alpha=k)
    k2 = ease_out_back(clamp((tt - 1.0) / 0.35))
    if k2 > 0:
        ctx.save()
        ctx.translate(W - 380, 200)
        ctx.scale(k2, k2)
        D.rrect(ctx, -300, -90, 600, 180, 26, hexrgb("#e8423c"), D.INK, 6)
        D.text(ctx, "DAY 30:", 0, -10, 60, D.FONT_TITLE, hexrgb("#fff6d8"))
        D.text(ctx, "SEALED", 0, 66, 70, D.FONT_TITLE, hexrgb("#ffe36a"))
        ctx.restore()


def icon(ctx, kind, x, y, s, t):
    ctx.save()
    ctx.translate(x, y)
    ctx.scale(s, s)
    if kind == 0:   # грузовик
        D.rect(ctx, -110, -60, 150, 90, hexrgb("#2f8fd8"), D.INK, 5, wob=0)
        D.rect(ctx, 40, -30, 70, 60, hexrgb("#e8423c"), D.INK, 5, wob=0)
        for wx in (-70, 70):
            D.circle(ctx, wx, 40, 22, hexrgb("#2b2f3a"), D.INK, 4)
    elif kind == 1:  # лодка
        D.poly(ctx, [(-120, 0), (120, 0), (90, 50), (-90, 50)], hexrgb("#e8423c"), D.INK, 5, wob=0)
        D.line(ctx, 0, 0, 0, -110, D.INK, 6)
        D.poly(ctx, [(6, -110), (80, -20), (6, -20)], hexrgb("#fbfaf6"), D.INK, 4, wob=0)
    else:
        PL.jet(ctx, 0, 60, 0.12, 1, "day", shadow=False)
    ctx.restore()


def shot_nothing(ctx, t, S):
    d = S.cue(2) - S.cue(1)
    D.vgrad(ctx, 0, 0, W, H, [(0, "#1c2440"), (1, "#0e1428")])
    for i, word in enumerate(("NO TRUCKS", "NO BOATS", "NO PLANES")):
        t0 = i * d * 0.22
        if t < t0:
            continue
        k = ease_out_back(clamp((t - t0) / 0.3))
        x = 380 + i * 580
        ctx.save()
        ctx.translate(x, 470)
        ctx.scale(k, k)
        D.circle(ctx, 0, 0, 200, hexrgb("#fff6d8"), D.INK, 8)
        icon(ctx, i, 0, 0, 1.2, t)
        if t > t0 + 0.3:
            D.line(ctx, -150, -150, 150, 150, hexrgb("#e8423c"), 26)
            D.line(ctx, 150, -150, -150, 150, hexrgb("#e8423c"), 26)
        ctx.restore()
        D.text(ctx, word, x, 760, 54, D.FONT_TITLE, hexrgb("#fff6d8"), alpha=k)
    if t > d * 0.7:
        pop_text(ctx, "INSIDE STAYS INSIDE.", W / 2, 220, t, d * 0.7, 90, "#e8423c", dur=d, shake=False)


def shot_fly_out(ctx, t, S):
    d = S.cue(3) - S.cue(2)
    camL = Cam(0, 300, 0.95)
    camR = Cam(OS.RADIO_X - 120, 560, 1.25)
    walt_talk = 1.0 if t > d * 0.45 else 0.0
    diag_split(ctx, lambda c: danny_radio(c, t, camL, 1.0 - walt_talk, "determined", DANNY_JACKET),
               lambda c: walt_radio(c, t, camR, walt_talk, "worried"), 1.0)
    if t < d * 0.45:
        speech(ctx, 520, 200, "THEN I'LL FLY OUT.", t, 0.1, 54, tail=(1, 1))
    else:
        speech(ctx, 1380, 200, "YOU CAN'T FLY, SON.", t, d * 0.45, 54, tail=(-1, 1))


def shot_teach(ctx, t, S):
    D.vgrad(ctx, 0, 0, W, H, [(0, "#e8423c"), (1, "#a8302a")])
    z = 1 + 0.08 * t
    ctx.save()
    ctx.translate(W / 2, H / 2 + 120)
    ctx.scale(z, z)
    DANNY_JACKET.head_only(ctx, 0, 0, 440, 1, {"view": "front", "face": "determined", "mouth": 0.3,
                                               "neck_line": False})
    ctx.restore()
    pop_text(ctx, "TEACH ME.", W / 2, 200, t, 0.1, 140, "#fff6d8", dur=4, shake=False)


def shot_roger(ctx, t, S):
    d = S.dur - S.cue(4)
    T_SQ = max(1.5, S.cue(4, True) - S.cue(4) - 1.7)
    cam = Cam(Keys((0, OS.RADIO_X - 100), (T_SQ, OS.PERCH_X - 20)), Keys((0, 560), (T_SQ, 520)),
              Keys((0, 1.5), (T_SQ, 3.0, "io")))
    walt_radio(ctx, t, cam, 0.0, "neutral", parrot_talk=1.0 if t > T_SQ else 0.0)
    if t < T_SQ:
        for k in range(3):
            pop_text(ctx, "...", 500 + k * 400, 300 + (k % 2) * 80, t, 0.3 + k * 0.6, 90, "#cfd8e0", dur=1.2,
                     shake=False)
        D.rrect(ctx, W - 470, 110, 380, 130, 24, hexrgb("#0e1410"), D.INK, 6)
        D.text(ctx, "0:%02d" % int(t * 6), W - 280, 200, 84, D.FONT_TITLE, hexrgb("#ff4a3a"))
    else:
        speech(ctx, W / 2 - 280, 260, "ROGER THAT!", t, T_SQ, 90, c="#3fae4a", tail=(1, 1))


def build(S):
    c = S.cue
    S.shots = [
        Shot(0, shot_news, "fade", 0.4),
        Shot(c(1) - 0.1, shot_nothing, "fade", 0.25),
        Shot(c(2) - 0.1, shot_fly_out, "whip", 0.25),
        Shot(c(3) - 0.1, shot_teach),
        Shot(c(4) - 0.1, shot_roger, "fade", 0.3),
    ]
    S.tods = [(0, "night")]
    S.sfx += [(c(1) + 0.4, "stamp", 0.8), (c(1) + 1.2, "stamp", 0.8), (c(1) + 2.0, "stamp", 0.8),
              (c(4) + 0.3, "crickets", 0.8), (c(4) + max(1.5, c(4, True) - c(4) - 1.7), "parrot", 1.0)]
    S.music = [(0, "dread", 0.8), (c(3), "hope", 0.8)]
