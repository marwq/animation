"""День 11: корабль стоит, море как стекло. Марина: шесть гидроциклов. Два падения — и полетел.
Круги вокруг лайнера на рассвете, дельфины рядом. Двадцать минут без мыслей."""
from scenes.kit import *
from scenes.shared import *

SUNRISE = "dawn"


def ride(ctx, t, x, wl, s, f=1, face="laugh", tilt=0.0, fig=None, c="#e8423c"):
    """Лео верхом на гидроцикле (ватерлиния wl)."""
    fig = fig or LEO_CAP
    ctx.save()
    ctx.translate(x, wl)
    ctx.rotate(tilt)
    IN.jetski(ctx, 0, 0, s * 0.0085, c, f, 0.0, SUNRISE)
    p = jetski_pose(t, face)
    fig.draw(ctx, -f * s * 0.35, -s * 0.85, s, f, p)
    ctx.restore()


def spray(ctx, x, y, t, f=1, a=1.0, seed=0):
    r = rng(seed)
    for i in range(14):
        ph = (t * 2.2 + r.random()) % 1
        px = x - f * (30 + 200 * ph)
        py = y - 60 * math.sin(math.pi * ph) * r.uniform(0.5, 1.2)
        D.circle(ctx, px, py, 7 * (1 - ph) + 2, hexrgb("#ffffff"), D.INK, 1.5, alpha=a * (1 - ph))


def shot_glass(ctx, t, S):
    cam = Cam(Keys((0, -100), (5, 100)), 420, Keys((0, 0.55), (5, 0.65)))
    sea_back(ctx, t, cam, SUNRISE, sun=(1200, 560, 80), hy=760, p=0.3)
    with layer(ctx, cam, t):
        # отражение корабля в гладкой воде
        ctx.save()
        ctx.translate(0, 1520)
        ctx.scale(1, -1)
        bg(ctx, "ship_dawn_dark", (-1500, -330, 3000, 1100), lambda c: SH.ship_side(c, 0, 760, 0.8, SUNRISE, 0.0))
        ctx.restore()
        D.rect(ctx, -3000, 762, 6000, 900, hexrgb(SEA.SEA[SUNRISE][0]), None, 0, wob=0, alpha=0.55)
        bg(ctx, "ship_dawn_dark", (-1500, -330, 3000, 1100), lambda c: SH.ship_side(c, 0, 760, 0.8, SUNRISE, 0.0))
        SEA.gulls(ctx, t, -1200, 1200, -200, 100, n=5, s=22)
    pop_text(ctx, "DEAD IN THE WATER", W / 2, 190, t, 0.6, 80, "#fff6d8", dur=4.5, shake=False)


def shot_marina(ctx, t, S):
    T_OPEN = 1.0
    cam = Cam(Keys((0, 1200), (4, 1500)), 560, Keys((0, 1.0), (4, 0.85)))
    with layer(ctx, cam, t):
        bg(ctx, "marina_dawn", (-700, -300, 4200, 1600), lambda c: IN.marina(c, SUNRISE))
        k = smooth(clamp((t - T_OPEN) / 1.2))
        x0, x1 = IN.MARINA_DOOR
        if k > 0:
            IN.marina_opening(ctx, t, SUNRISE, (2500, 520, 60))
        # двери-шторки разъезжаются
        D.rect(ctx, x0, 120, (x1 - x0) / 2 * (1 - k), IN.FL - 120, hexrgb("#c9d0d4"), D.INK, 4, wob=0)
        D.rect(ctx, x1 - (x1 - x0) / 2 * (1 - k), 120, (x1 - x0) / 2 * (1 - k), IN.FL - 120, hexrgb("#c9d0d4"), D.INK,
               4, wob=0)
        p = R.stand("side", t, 1)
        p.update(face="shock" if k > 0.3 else "smile", blink=0 if k > 0.3 else p["blink"], hturn=0.6)
        LEO_CAP.draw(ctx, 1150, IN.FL, 120, 1, p)
        for i, c in enumerate(("#3fbf6a", "#f05a8a", "#7a4fc2")):
            IN.jetski(ctx, 1600 + i * 360, IN.FL - 70, 0.8, c, tod=SUNRISE)
    fx.glow(ctx, *cam.to_screen(t, 2150, 500), 800, "#ffd8a0", 0.3 * smooth(clamp((t - 1.0) / 1.2)))
    pop_text(ctx, "x6", 1500, 260, t, 1.6, 140, "#ffe36a", dur=3.0)


def stern_bg(ctx, t, cam):
    sea_back(ctx, t, cam, SUNRISE, sun=(2400, 500, 80), hy=600, p=0.4)
    ship_ext(ctx, t, cam, -900, 760, 1.6, SUNRISE, 0.0, f=-1, wake=0.0, smoke=False)


def shot_fall(ctx, t, S):
    """Два падения, на третий раз — поехал."""
    cam = Cam(Keys((0, 800), (4.5, 1300)), 680, 1.0)
    stern_bg(ctx, t, cam)
    with layer(ctx, cam, t):
        for k, t0 in enumerate((0.2, 1.4)):
            tt = t - t0
            if 0 <= tt < 1.2:
                x = 700 + tt * 300
                if tt < 0.4:
                    ride(ctx, t, x, 800, 100, 1, "scared", tilt=-0.2 * tt / 0.4)
                else:
                    kk = (tt - 0.4) / 0.8
                    IN.jetski(ctx, x + 80, 800, 0.85, "#e8423c", 1, 0.3 * kk, SUNRISE)
                    ctx.save()
                    ctx.translate(x + 120 + kk * 140, 640 - math.sin(math.pi * min(kk, 1)) * 120 + kk * 160)
                    ctx.rotate(kk * 4)
                    p = R.stand("side", t, 1)
                    p.update(face="scream", a1=(2.7, 0.2), a2=(2.4, 0.4), k1=(1.0, 0.5))
                    LEO_CAP.draw(ctx, 0, 0, 100, 1, p)
                    ctx.restore()
                    if kk > 0.7:
                        SEA.splash(ctx, x + 270, 800, (kk - 0.7) / 0.3 * 0.5, 1.2, seed=k)
        if t > 2.6:
            x = 900 + (t - 2.6) * 600
            ride(ctx, t, x, 800, 100, 1, "laugh")
            spray(ctx, x - 120, 800, t)
    for k, t0 in enumerate((0.75, 1.95)):
        pop_text(ctx, "SPLASH!", 700 + k * 400, 300, t, t0, 100, "#7fd0ff", dur=0.7)
    if t > 2.7:
        pop_text(ctx, "GOT IT!", W / 2 + 300, 260, t, 2.7, 110, "#ffe36a", dur=1.5)


def shot_laps(ctx, t, S):
    """Вдоль огромного борта на рассвете, рядом прыгают дельфины."""
    x = Keys((0, 1800), (6, -1900, "lin"))
    cam = Cam(lambda tt: x(tt) - 100, 600, Keys((0, 0.95), (6, 0.85)))
    sea_back(ctx, t, cam, SUNRISE, sun=(-400, 450, 80), hy=640, p=0.25)
    ship_ext(ctx, t, cam, 0, 700, 1.15, SUNRISE, 0.0, wake=0.0, smoke=False)
    with layer(ctx, cam, t):
        D.rect(ctx, -4000, 702, 8000, 600, hexrgb(SEA.SEA[SUNRISE][1]), None, 0, wob=0, alpha=0.4)
        xx = x(t)
        for k in range(3):
            ph = (t * 0.55 + k * 0.33) % 1.0
            SEA.dolphin(ctx, xx - 300 - k * 190, 930 + k * 30, 62, ph, -1)
        ride(ctx, t, xx, 900, 105, -1, "laugh")
        spray(ctx, xx + 120, 900, t, -1, seed=3)
        for k in range(30):
            u = k / 30
            D.ellipse(ctx, xx + 120 + u * 1200, 905 + math.sin(t * 3 + k) * 3, 30 + 80 * u, 5 + 8 * u, (1, 1, 1),
                      None, 0, alpha=0.5 * (1 - u))
    motion_lines(ctx, W / 2 + 200, 760, -1, 5, 260, 40, a=0.6)


def shot_forget(ctx, t, S):
    cam = Cam(0, 0, 1.0)
    D.vgrad(ctx, 0, 0, W, H, [(0, "#3a5aa8"), (0.6, "#e88aa0"), (1, "#ffd49a")])
    SEA.sun(ctx, 1500, 520, 140, "dawn")
    p = R.stand("side", t, 1)
    p.update(face="laugh", blink=1.0, hturn=0.6, lean=-0.1 + math.sin(t * 9) * 0.02, h1=(0.85, -2.3), h2=(0.8, -2.25))
    LEO_CAP.draw(ctx, 820, 1700, 330, -1, p)
    for i in range(10):
        y = 200 + i * 80
        ph = (t * 1.6 + i * 0.37) % 1
        D.line(ctx, 1900 - ph * 1900, y, 2100 - ph * 1900, y, hexrgb("#ffffff"), 5, 0.6)
    fx.flash(ctx, clamp((t - 2.2) / 1.2) * 0.5, "#fff6e8")


def build(S):
    c = S.cue
    S.shots = [
        Shot(0, shot_glass),
        Shot(c(1) - 0.1, shot_marina, "fade", 0.3),
        Shot(c(2) - 0.1, shot_fall),
        Shot(c(3) - 0.1, shot_laps, "whip", 0.3),
        Shot(c(4) - 0.1, shot_forget, "fade", 0.3),
    ]
    S.sfx += [(c(1) + 1.0, "door_slide", 0.8), (c(2) + 0.85, "splash", 0.9), (c(2) + 2.05, "splash", 0.9),
              (c(2) + 2.6, "jetski", 1.0), (c(3), "jetski", 0.8)]
    S.music = "joy"
