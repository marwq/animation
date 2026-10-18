"""День 26: Уолт звучит иначе. Срок сдвинули — зону закроют в полдень тридцатого дня. Одна попытка, один
взлёт, прерывать нельзя. Последний урок: «Не управляй самолётом, сынок. Дай ей лететь». — «Роджер дэт»."""
from scenes.kit import *
from scenes.shared import *


def shot_different(ctx, t, S):
    d = S.cue(1) - 0.1
    cam = Cam(Keys((0, OS.RADIO_X - 300), (d, OS.RADIO_X - 260)), 480, Keys((0, 1.8), (d, 2.4)))
    walt_radio(ctx, t, cam, 0.0, "worried", "night")
    fx.darkness(ctx, 0.25, [fx.Light(W / 2, H / 2, 600, power=0.5, glow_a=0.0)])


def shot_moved(ctx, t, S):
    d = S.cue(2) - S.cue(1)
    D.vgrad(ctx, 0, 0, W, H, [(0, "#2a2448"), (1, "#141030")])
    k = ease_out_back(clamp(t / 0.35))
    ctx.save()
    ctx.translate(W / 2, H / 2)
    ctx.scale(k, k)
    D.rrect(ctx, -560, -280, 1120, 560, 40, hexrgb("#fbf6ee"), D.INK, 8)
    D.rect(ctx, -560, -280, 1120, 110, hexrgb("#e8423c"), D.INK, 8, wob=0)
    D.text(ctx, "DAY 30", 0, -200, 76, D.FONT_TITLE, hexrgb("#fff6d8"))
    D.text(ctx, "ZONE CLOSES AT", 0, -60, 60, D.FONT_TITLE, hexrgb("#1c3f7c"))
    D.text(ctx, "MIDNIGHT", 0, 70, 110, D.FONT_TITLE, hexrgb("#9aa3ac"))
    kk = clamp((t - 0.8) / 0.25)
    if kk > 0:
        D.line(ctx, -280, 40, -280 + 560 * kk, 40, hexrgb("#e8423c"), 18)
    if t > 1.1:
        D.text(ctx, "NOON", 0, 210, 130, D.FONT_TITLE, hexrgb("#e8423c"), rot=-0.05,
               alpha=clamp((t - 1.1) / 0.2))
    ctx.restore()


def shot_once(ctx, t, S):
    d = S.cue(3) - S.cue(2)
    D.vgrad(ctx, 0, 0, W, H, [(0, "#1c2440"), (1, "#0e1428")])
    for i, (txt, c) in enumerate((("1 TRY", "#ffe36a"), ("1 TAKEOFF", "#4cff8a"), ("NO ABORT", "#ff4a3a"))):
        t0 = i * d * 0.25
        if t < t0:
            continue
        k = ease_out_back(clamp((t - t0) / 0.3))
        ctx.save()
        ctx.translate(360 + i * 600, H / 2)
        ctx.scale(k, k)
        D.rrect(ctx, -250, -140, 500, 280, 30, hexrgb("#0e1410"), D.INK, 8)
        D.text(ctx, txt, 0, 30, 82, D.FONT_TITLE, hexrgb(c))
        ctx.restore()


def shot_lesson(ctx, t, S):
    d = S.cue(4) - S.cue(3)
    camL = Cam(0, 300, 0.95)
    camR = Cam(OS.RADIO_X - 120, 560, 1.25)
    diag_split(ctx, lambda c: danny_radio(c, t, camL, 0.0, "sad", DANNY_JACKET),
               lambda c: walt_radio(c, t, camR, 1.0, "smile"), 1.0)
    speech(ctx, 1380, 200, "DON'T FLY THE PLANE, SON.", t, 0.1, 48, tail=(-1, 1), dur=d * 0.55)
    speech(ctx, 1380, 200, "LET HER FLY.", t, d * 0.55, 70, tail=(-1, 1))


def shot_roger(ctx, t, S):
    d = S.dur - S.cue(4)
    D.vgrad(ctx, 0, 0, W, H, [(0, "#e8423c"), (1, "#a8302a")])
    z = 1 + 0.05 * t
    ctx.save()
    ctx.translate(W / 2 - 200, H / 2 + 120)
    ctx.scale(z, z)
    DANNY_JACKET.head_only(ctx, 0, 0, 420, 1, {"view": "front", "face": "determined", "mouth": 0.3,
                                               "neck_line": False})
    headset_on(ctx, 0, 0, 3.6)
    ctx.restore()
    pop_text(ctx, "ROGER THAT.", W / 2 + 330, 260, t, 0.2, 110, "#fff6d8", dur=d, shake=False)


def build(S):
    c = S.cue
    S.shots = [
        Shot(0, shot_different, "fade", 0.4),
        Shot(c(1) - 0.1, shot_moved, "fade", 0.25),
        Shot(c(2) - 0.1, shot_once, "fade", 0.25),
        Shot(c(3) - 0.1, shot_lesson, "fade", 0.3),
        Shot(c(4) - 0.1, shot_roger),
    ]
    S.tods = [(0, "night")]
    S.sfx += [(c(1) + 0.8, "stamp", 1.0), (c(2), "sting", 0.9)]
    S.music = [(0, "dread", 0.8), (c(3), "hope", 1.0)]
