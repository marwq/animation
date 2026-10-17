"""Эпилог: вертолёт над Манхэттеном, пустой ТЦ, «YOU WERE HERE», кухня в Квинсе."""
from scenes.kit import *
from scenes.d02 import ALL_CLOSED
from sets import stores as ST


def flyaway_bg(c):
    C.sky(c, -2000, -1200, 6000, 2600, "dawn", sun=(2600, 380, 90))
    C.clouds(c, -1500, -600, 5000, seed=9, color="#f6c9b0", alpha=0.4, n=9, scale=1.6)
    C.skyline(c, -2000, 4000, 900, "dawn", depth=0, seed=401, esb_x=500, hmin=300, hmax=650)
    C.skyline(c, -2000, 4000, 1150, "dawn", depth=1, seed=403, hmin=200, hmax=520)


def shot_fly(ctx, t, S):
    """Вертолёт уходит в рассвет; на крыше Статуя Свободы тянет руки вслед."""
    cam = Cam(Keys((0, 900), (5, 1200)), Keys((0, 600), (5, 520)), Keys((0, 1.0), (5, 0.85)))
    with layer(ctx, cam, t, 0.4):
        bg(ctx, "flyaway", (-2000, -1200, 6000, 2600), flyaway_bg, scale=0.6)
    with layer(ctx, cam, t):
        hx = lerp(800, 2300, t / 5)
        CITY.helicopter(ctx, hx, 380 - t * 30, 0.5, t, False, 1.0, -0.08)
        D.line(ctx, hx - 20, 420 - t * 30, hx - 30, 640 - t * 30, hexrgb("#8a6a52"), 4)
        CITY.parapet_front(ctx, -1200, 3200, 1100, tod="dawn")
        p = zombie_reach(t, 3)
        p.update(a1=(2.6 + 0.15 * math.sin(t * 4), -0.2), a2=(2.5, -0.1), mouth=0.8)
        LIBERTY.draw(ctx, 700, 1100, 100, 1, p)
    fx.grade(ctx, "dawn", 0.3)


def shot_map(ctx, t, S):
    """Пустой ТЦ, карта: рядом с YOU ARE HERE и SAM дописано WAS."""
    cam = Cam(Keys((0, 1020), (5, 960)), Keys((0, 540), (5, 520)), Keys((0, 2.0), (5, 1.0, "io")))
    with layer(ctx, cam, t):
        bg(ctx, "d02_mapwall", (-400, -50, 2800, 1300), lambda c: M.gallery(c, -400, 2400, "day", 0.9, ALL_CLOSED))
        M.mall_map(ctx, 960, 520, 0.62, name_k=1.0, was_k=clamp((t - 0.6) / 0.8), dot_pulse=t)
        D.line(ctx, 960, 730, 960, M.GAL_FLOOR, D.INK, 10)
        D.rect(ctx, 900, M.GAL_FLOOR - 12, 120, 14, hexrgb("#4a4744"), D.INK, 2, wob=0)
    fx.grade(ctx, "warm", 0.2)


def shot_queens(ctx, t, S):
    """Квинс, рассвет: угловой кусочек лазаньи с запиской «SAM». Мама и Лили у окна смотрят вверх."""
    cam = Cam(Keys((0, 1350), (6, 1250)), Keys((0, 620), (6, 560)), Keys((0, 1.4), (6, 1.1)))
    with layer(ctx, cam, t):
        bg(ctx, "kitchen", (-400, -100, 2800, 1400), ST.kitchen)
        px, py = 1400, 700
        D.ellipse(ctx, px, py, 80, 18, hexrgb("#f4efe4"), D.INK, 3)
        D.poly(ctx, [(px - 46, py - 6), (px + 34, py - 6), (px + 34, py - 46), (px - 46, py - 46)], hexrgb("#c9502f"),
               D.INK, 2.5, wob=0)
        D.rect(ctx, px - 46, py - 34, 80, 9, hexrgb("#f2c45a"), None, 0, wob=0)
        D.rect(ctx, px + 50, py - 70, 70, 50, hexrgb("#f6f1e6"), D.INK, 2, wob=0.4)
        D.text(ctx, "SAM", px + 85, py - 36, 26, D.FONT_HAND, hexrgb("#1f2a55"))
        p = R.stand("side", t, 5)
        p.update(neck=-0.35, look=(0.6, -1), face="smile")
        MOM.draw(ctx, 1300, 880, 110, 1, p)
        p2 = R.stand("side", t, 6)
        p2.update(neck=-0.4, look=(0.6, -1), face="happy", a2=(2.7, 0.3))
        LILY.draw(ctx, 1150, 880, 110, 1, p2)
        # вертолёт в окне
        from scenes.d12 import heli_far
        heli_far(ctx, lerp(1300, 1600, t / 6), 260, 0.25, t, light=False)
    fx.grade(ctx, "dawn", 0.25)
    fx.flash(ctx, clamp((t - (S.dur - S.shots[-1].start - 1.2)) / 1.2), "#000000")


def build(S):
    c = S.cue
    S.shots = [
        Shot(0, shot_fly),
        Shot(c(1) - 0.2, shot_map, "fade", 0.4),
        Shot(c(2) - 0.2, shot_queens, "fade", 0.5),
    ]
    S.show_day = True
