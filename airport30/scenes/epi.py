"""Эпилог: Аризона — Уолт ждёт в конце грунтовой полосы, попугай садится тебе на голову. Через неделю
бабушка Джун впервые летит на самолёте. С тобой."""
from scenes.kit import *
from scenes.shared import *


def place_tag(ctx, txt, t, c="#fff6d8"):
    k = ease_out_back(clamp(t / 0.35))
    ctx.save()
    ctx.translate(70, 210)
    ctx.scale(k, k)
    D.rrect(ctx, 0, -50, 40 + 34 * len(txt), 100, 24, hexrgb("#1c3f7c"), D.INK, 6)
    D.text(ctx, txt, 20 + 17 * len(txt), 22, 62, D.FONT_TITLE, hexrgb(c))
    ctx.restore()


def shot_arizona(ctx, t, S):
    d = S.cue(1) - 0.1
    T_LAND, T_MEET = d * 0.35, d * 0.5
    if t < T_MEET:
        cam = Cam(Keys((0, 600), (T_MEET, 1000)), 420, 0.55)
        with layer(ctx, cam, t):
            bg(ctx, "walt_day", (-1400, -1400, 5000, 3300), lambda c: OS.walt_place(c, "day"), 0.6)
            k = smooth(clamp(t / T_LAND))
            rx = lerp(-1800, 700, k) + 400 * smooth(clamp((t - T_LAND) / (T_MEET - T_LAND)))
            ry = lerp(-100, OS.FL + 170, k)
            PL.rosie(ctx, rx, ry, 0.8, 1, "day", spin=1.0, prop=t * 40, roll=-0.06 * (1 - k), shadow=k > 0.9,
                     cabin=lambda c: DANNY_PILOT.head_only(c, 236, -178, 50, 1, {"view": "side", "face": "laugh",
                                                                                  "neck_line": False}))
            if k > 0.95:
                for j in range(3):
                    ph = (t * 2 + j / 3) % 1
                    D.circle(ctx, rx - 340 - ph * 200, ry - 10 - ph * 30, 14 + 30 * ph, hexrgb("#e8c39a"), None, 0,
                             alpha=0.6 * (1 - ph))
            p = R.stand("side", t, 3)
            wave = math.sin(t * 8)
            p.update(face="laugh", h1=(2.8 + 0.2 * wave, -0.4), hturn=0.5)
            WALT.draw(ctx, 1700, OS.FL - 40, 110, -1, p)
        place_tag(ctx, "ARIZONA", t)
        return
    tt = t - T_MEET
    dm = d - T_MEET
    cam = Cam(1250, 520, Keys((0, 1.15), (dm, 1.3)))
    with layer(ctx, cam, tt):
        bg(ctx, "walt_day", (-1400, -1400, 5000, 3300), lambda c: OS.walt_place(c, "day"), 0.6)
        p = R.stand("side", tt, 1)
        p.update(face="laugh", h1=(0.9, -2.0), hturn=0.5)
        DX = 1050
        DANNY_PILOT.draw(ctx, DX, OS.FL - 40, 115, 1, p)
        q = R.stand("side", tt, 3)
        q.update(face="laugh", h1=(0.9, -2.0), hturn=0.5)
        WALT.draw(ctx, DX + 300, OS.FL - 40, 115, -1, q)
        draw_lab(ctx, DX - 250, OS.FL - 40, 100, 1, dog_pose(tt, "sit", wag=1.0, bark=0.3 * max(0, math.sin(tt * 6))))
        k = smooth(clamp((tt - 0.2) / 0.8))
        hx, hy = DX + 6, OS.FL - 40 - 4.1 * 115
        px = lerp(OS.PERCH_X, hx, k)
        py = lerp(OS.FL - 336, hy, k) - math.sin(k * math.pi) * 220
        draw_parrot(ctx, px, py, 90, -1, tt, talk=1.0 if k >= 1 else 0.0, fly=0.0 if k >= 1 else 1.0)
    if tt > 1.0:
        pop_text(ctx, "ROGER THAT!", W / 2 + 420, 230, tt, 1.0, 100, "#3fae4a", dur=dm, shake=False)
    place_tag(ctx, "ARIZONA", 1.0)


def cabin_june(t):
    def fn(c):
        DANNY_PILOT.head_only(c, 236, -178, 50, 1, {"view": "side", "face": "smile", "neck_line": False})
        JUNE.head_only(c, 128, -176, 48, 1, {"view": "front", "face": "laugh", "mouth": 0.6 + 0.3 * math.sin(t * 9),
                                             "neck_line": False})
    return fn


def shot_june(ctx, t, S):
    d = S.dur - S.cue(1)
    T_CLOSE = d * 0.45
    if t < T_CLOSE:
        cam = Cam(Keys((0, 900), (T_CLOSE, 1300)), 380, 0.55)
        with layer(ctx, cam, t):
            bg(ctx, "kansas_golden", (-1400, -1400, 5200, 3300), lambda c: OS.kansas(c, 0, "golden"), 0.6)
            x = -400 + t * 900
            y = 160 + math.sin(t * 1.5) * 30
            PL.rosie(ctx, x, y, 0.9, 1, "golden", spin=1.0, prop=t * 40, roll=0.04 * math.sin(t * 1.5),
                     shadow=False, cabin=cabin_june(t))
        place_tag(ctx, "KANSAS", t)
        pop_text(ctx, "1 WEEK LATER", W / 2 + 300, 200, t, 0.3, 70, "#fff6d8", dur=T_CLOSE, shake=False)
        return
    tt = t - T_CLOSE
    dc = d - T_CLOSE
    SEA.sky(ctx, 0, 0, W, H, "sunset")
    SEA.sun(ctx, 1500, 700, 120, "sunset")
    fx.glow(ctx, 1500, 700, 800, "#ffc890", 0.4)
    for k in range(4):
        SEA.cloud(ctx, (k * 600 - tt * 500) % (W + 800) - 400, 820 + (k % 2) * 90, 1.6, "sunset", seed=60 + k)
    cam = Cam(180, -190, Keys((0, 3.0), (dc, 3.4)), shake=0.05)
    with layer(ctx, cam, tt):
        PL.rosie(ctx, 0, 0, 1.0, 1, "golden", spin=1.0, prop=tt * 40, shadow=False, cabin=cabin_june(tt))
    speed_lines(ctx, tt, n=20, a=0.15)
    if tt > 0.3:
        pop_text(ctx, "HER FIRST FLIGHT.", W / 2, 180, tt, 0.3, 90, "#fff6d8", dur=dc, shake=False)
    if tt > dc * 0.5:
        pop_text(ctx, "WITH YOU.", W / 2 + 40, 300, tt, dc * 0.5, 100, "#ffd23a", dur=dc, shake=False)


def build(S):
    c = S.cue
    S.shots = [
        Shot(0, shot_arizona, "fade", 0.5),
        Shot(c(1) - 0.1, shot_june, "fade", 0.4),
    ]
    S.tods = [(0, "day")]
    S.sfx += [(0.0, "engine_down", 0.8), (1.0, "parrot", 0.6), (c(1) - 2.0, "parrot", 0.9), (c(1), "wind", 0.6),
              (c(1) + 0.5, "engine", 0.5)]
    S.music = "happy_end"
