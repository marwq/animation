"""День 6: выход B4, у телетрапа стоит лайнер, в его рации ещё есть заряд. «Алло» в пустоту — и ответ:
Уолт, 72, командир на пенсии, грунтовая полоса в Аризоне, попугай Роджер. «За тобой никто не придёт,
сынок. Но и я никуда не денусь. В восемь. Каждый вечер»."""
from scenes.kit import *
from scenes.shared import *

BX = TM.gate_xs("B")[3]


def shot_bridge(ctx, t, S):
    d = S.cue(1) - 0.1
    cam = Cam(Keys((0, 1500), (d, 1650)), 560, Keys((0, 0.85), (d, 1.0)))
    apron_back(ctx, t, cam, "night", 0.0, moon=(2600, -200, 50), x0=-1600, x1=4600)
    with layer(ctx, cam, t):
        PL.jet(ctx, 1900, AP.GY + 40, 0.75, -1, "night", lit=0.0, door=1.0)
        # фонарик в двери самолёта и мигающая лампочка кабины
        x = Keys((0, 1100), (d, 1360))(t)
        fx.glow(ctx, x, 470, 120, "#ffe9a0", 0.5)
        D.circle(ctx, 2620, 440, 10, hexrgb("#4cff8a") if (t * 2) % 1 < 0.6 else hexrgb("#1a3a2a"), None, 0)
    fx.darkness(ctx, 0.35, [fx.Light(*cam.to_screen(t, 1300, 470), 300, power=0.7, glow_a=0.0)])
    D.rrect(ctx, 100, 110, 300, 120, 24, hexrgb("#15181f"), D.INK, 6)
    D.text(ctx, "B4", 250, 200, 90, D.FONT_TITLE, hexrgb("#ffd23a"))
    D.rrect(ctx, W - 520, 110, 420, 120, 24, hexrgb("#15181f"), D.INK, 6)
    D.text(ctx, "RADIO: ON", W - 310, 196, 66, D.FONT_TITLE, hexrgb("#4cff8a"))


def shot_hello(ctx, t, S):
    cam = Cam(0, 300, 0.95)
    danny_radio(ctx, t, cam, talk=1.0 if t < 1.6 else 0.0, face="worried")
    speech(ctx, W / 2 + 300, 330, "hello?", t, 0.3, 80, tail=(-1, 1))


def shot_walt(ctx, t, S):
    d = S.cue(3) - S.cue(2)
    camL = Cam(0, 300, 0.95)
    camR = Cam(OS.RADIO_X - 120, 560, 1.25)
    diag_split(ctx, lambda c: danny_radio(c, t, camL, 0.0, "shock"),
               lambda c: walt_radio(c, t, camR, 1.0, "smile"), clamp(t / 0.4))
    tags = [("WALT, 72", "#ffe36a"), ("RETIRED CAPTAIN", "#fff6d8"), ("ARIZONA", "#ff9a3c"), ("+ ROGER", "#3fbf6a")]
    for i, (txt, c) in enumerate(tags):
        t0 = 0.8 + i * (d - 1.6) / 4
        if t > t0:
            k = ease_out_back(clamp((t - t0) / 0.3))
            ctx.save()
            ctx.translate(1420, 200 + i * 110)
            ctx.rotate(-0.04 + 0.03 * i)
            ctx.scale(k, k)
            w = D.text_width(ctx, txt, 54, D.FONT_TITLE) + 60
            D.rrect(ctx, -w / 2, -45, w, 90, 20, hexrgb("#15181f"), D.INK, 5)
            D.text(ctx, txt, 0, 20, 54, D.FONT_TITLE, hexrgb(c))
            ctx.restore()


def shot_promise(ctx, t, S):
    d = S.dur - S.cue(3)
    T_CLOCK = d * 0.6
    cam = Cam(OS.RADIO_X - 240, 520, Keys((0, 1.6), (d, 1.9)))
    walt_radio(ctx, t, cam, 1.0 if t < T_CLOCK + 1.0 else 0.0, "smile", parrot_talk=0.0)
    if t < T_CLOCK:
        speech(ctx, W / 2 + 380, 220, "NOBODY'S COMING, SON.", t, 0.2, 54, tail=(-1, 1), dur=T_CLOCK * 0.5)
        speech(ctx, W / 2 + 380, 220, "BUT I'M NOT GOING ANYWHERE.", t, T_CLOCK * 0.5, 50, tail=(-1, 1))
    else:
        k = ease_out_back(clamp((t - T_CLOCK) / 0.35))
        ctx.save()
        ctx.translate(W - 380, 300)
        ctx.scale(k, k)
        D.rrect(ctx, -300, -120, 600, 240, 30, hexrgb("#0e1410"), D.INK, 6)
        D.text(ctx, "20:00", 0, 30, 130, D.FONT_TITLE, hexrgb("#ff4a3a"))
        D.text(ctx, "EVERY NIGHT", 0, 100, 40, D.FONT_TITLE, hexrgb("#fff6d8"))
        ctx.restore()


def build(S):
    c = S.cue
    S.shots = [
        Shot(0, shot_bridge, "fade", 0.4),
        Shot(c(1) - 0.1, shot_hello, "fade", 0.3),
        Shot(c(2) - 0.1, shot_walt),
        Shot(c(3) - 0.1, shot_promise, "fade", 0.3),
    ]
    S.tods = [(0, "night")]
    S.sfx += [(c(1), "static", 0.8), (c(2), "radio_beep", 0.9), (c(2) + 2.5, "parrot", 0.8)]
    S.music = [(0, "mystery", 0.8), (c(2), "warm", 1.0)]
