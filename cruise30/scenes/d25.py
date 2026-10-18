"""День 25: утро, шторм ушёл — вместе с антенной. Нет антенны — нет Долорес и нет связи с «Вэлиантом».
Запасная — на верхушке радарной мачты, двадцать метров вверх на качающемся корабле. Лезешь, не смотришь
вниз, чинишь. Первый голос — Долорес сквозь слёзы: «Малыш, я думала, что потеряла тебя»."""
from scenes.kit import *
from scenes.shared import *
from scenes.d06 import dolores_at_radio, leo_mic

MAST_X = 960
MAST_BASE = 1300
MAST_TOP = -1500


def mast(ctx, t, broken=True, fixed=0.0):
    D.rect(ctx, -2000, MAST_BASE, 5000, 900, hexrgb("#e8ecef"), D.INK, 4, wob=0)
    D.rect(ctx, MAST_X - 40, MAST_TOP, 80, MAST_BASE - MAST_TOP, hexrgb("#f4f6f6"), D.INK, 5, wob=0)
    DK.ladder(ctx, MAST_X + 90, MAST_TOP + 60, MAST_BASE, "morning", w=70)
    for k in range(5):
        y = MAST_BASE - 500 - k * 560
        D.line(ctx, MAST_X - 160, y, MAST_X + 160, y, D.INK, 10)
        D.line(ctx, MAST_X - 160, y, MAST_X + 160, y, hexrgb("#d8dee2"), 5)
    # радар
    w = 200 * math.cos(t * 1.5)
    D.rect(ctx, MAST_X - abs(w), MAST_TOP + 120, abs(w) * 2 + 1, 18, hexrgb("#f4f4f0"), D.INK, 3, wob=0)
    if broken and fixed <= 0:
        D.line(ctx, MAST_X, MAST_TOP, MAST_X + 30, MAST_TOP - 60, D.INK, 6)
        D.line(ctx, MAST_X + 30, MAST_TOP - 60, MAST_X + 90, MAST_TOP - 40, D.INK, 6)
    else:
        D.line(ctx, MAST_X, MAST_TOP, MAST_X, MAST_TOP - 300 * max(fixed, 1.0 if not broken else 0), D.INK, 7)
        D.circle(ctx, MAST_X, MAST_TOP - 300 * max(fixed, 1.0 if not broken else 0), 10, hexrgb("#e8423c"), None, 0)


def shot_after(ctx, t, S):
    cam = Cam(Keys((0, 400), (4, 300)), Keys((0, 500), (4, 380)), Keys((0, 0.75), (4, 0.9)))
    sea_back(ctx, t, cam, "morning", sun=(1400, 200, 70), hy=640, p=0.3)
    with layer(ctx, cam, t, 0.3):
        r = rng(25)
        for i in range(10):
            x = r.uniform(-1500, 2500)
            ctx.save()
            ctx.translate(x + math.sin(t + i) * 10, 700 + r.uniform(0, 300))
            ctx.rotate(r.uniform(-0.5, 0.5))
            DK.lounger(ctx, 0, 0, hexrgb(r.choice(["#e8423c", "#f2c230", "#2f8fd8"])), "morning")
            ctx.restore()
    ship_ext(ctx, t, cam, 0, 760, 0.85, "morning", 0.0, wake=0.0, smoke=False, slides=False, antenna=False)
    k = ease_out_back(clamp((t - 2.2) / 0.3))
    if k > 0:
        x, y = cam.to_screen(t, 0.85 * 860, 760 - 0.85 * 800)
        D.circle(ctx, x, y, 90 * k, None, hexrgb("#e8423c"), 8)
        pop_text(ctx, "ANTENNA: GONE", x + 40, y - 170, t, 2.2, 70, "#e8423c", dur=3, shake=False)


def shot_static(ctx, t, S):
    cam = Cam(1950, 560, Keys((0, 1.5), (3, 1.7)))
    leo_mic(ctx, t, cam, "sad", 0.0)
    for k in range(4):
        y = 300 + k * 50
        pts = [(1300 + i * 20, y + noise1(i * 0.8 + t * 25, k) * 20) for i in range(25)]
        D.polyline(ctx, pts, hexrgb("#9fb0d0"), 4, 0.8)
    ctx.save()
    ctx.translate(560, 300)
    D.rrect(ctx, -120, -120, 240, 240, 30, hexrgb("#f6d8b0"), D.INK, 6)
    DOLORES.head_only(ctx, 0, 0, 160, 1, {"view": "front", "face": "smile", "neck_line": False})
    D.line(ctx, -130, -130, 130, 130, hexrgb("#e8423c"), 14)
    D.line(ctx, 130, -130, -130, 130, hexrgb("#e8423c"), 14)
    ctx.restore()


def shot_mast(ctx, t, S):
    """Снизу вверх: мачта качается на фоне неба. 20 метров."""
    sw = math.sin(t * 1.3) * 0.06
    cam = Cam(MAST_X, Keys((0, 900), (4, -900)), Keys((0, 0.75), (4, 0.6)), Keys((0, sw), (4, -sw)))
    sea_back(ctx, t, cam, "morning", sun=(1400, -800, 70), hy=1500, p=0.2)
    with layer(ctx, cam, t):
        mast(ctx, t)
        p = R.stand("back", t, 1)
        p.update(look=(0, -1), neck=-0.5)
        LEO_CAP.draw(ctx, MAST_X + 260, MAST_BASE, 110, 1, p)
    D.rrect(ctx, W - 430, 120, 330, 130, 24, hexrgb("#fff6d8"), D.INK, 6)
    D.text(ctx, "60 FT", W - 265, 210, 90, D.FONT_TITLE, hexrgb("#e8423c"))


def shot_climb(ctx, t, S):
    d = S.cue(4) - S.cue(3)
    T_TOP = d * 0.6
    total_u = (MAST_BASE - (MAST_TOP + 120)) / 105.0
    u = total_u * ease_io(clamp(t / T_TOP))
    roll = math.sin(t * 1.5) * 0.08
    cam = Cam(MAST_X + 90, lambda tt: MAST_BASE - total_u * ease_io(clamp(tt / T_TOP)) * 105 - 250, 1.0, roll)
    sea_back(ctx, t, cam, "morning", sun=(1400, -800, 70), hy=2500, p=0.2)
    with layer(ctx, cam, t):
        fixed = clamp((t - T_TOP - 0.3) / 0.8)
        mast(ctx, t, broken=True, fixed=fixed)
        p = climb_pose(u, "back", "determined")
        p["blink"] = 1.0
        J = LEO_CAP.draw(ctx, MAST_X + 90, MAST_BASE - u * 105, 105, 1, p)
        if t > T_TOP:
            for i in range(6):
                a = t * 20 + i
                fx.glow(ctx, MAST_X + math.cos(a) * 30, MAST_TOP - 30 + math.sin(a) * 30, 30, "#ffe36a", 0.7)
    if t < T_TOP:
        pop_text(ctx, "DON'T LOOK DOWN", W / 2, 230, t, 0.3, 80, "#fff6d8", dur=T_TOP, shake=False)
    else:
        pop_text(ctx, "FIXED!", W / 2 + 300, 300, t, T_TOP + 0.9, 140, "#4cff8a", dur=2.5)


def shot_crying(ctx, t, S):
    camL = Cam(2240, 560, 1.4)
    camR = Cam(30, 650, 1.5)
    diag_split(ctx, lambda c: leo_mic(c, t, camL, "laugh", 0.0),
               lambda c: dolores_at_radio(c, t, camR, 1.0, "cry"), 1.0)
    pop_text(ctx, "KID...", W / 2 + 300, 230, t, 0.6, 110, "#fff6d8", dur=4, shake=False)


def build(S):
    c = S.cue
    S.shots = [
        Shot(0, shot_after),
        Shot(c(1) - 0.1, shot_static, "fade", 0.25),
        Shot(c(2) - 0.1, shot_mast, "fade", 0.25),
        Shot(c(3) - 0.1, shot_climb),
        Shot(c(4) - 0.1, shot_crying, "fade", 0.3),
    ]
    S.sfx += [(c(1), "static", 0.8), (c(3) + 2.5, "spark", 0.8), (c(4), "radio_beep", 0.8)]
    S.music = "hope"
