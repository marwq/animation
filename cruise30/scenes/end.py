"""Конечная заставка: место под элементы YouTube (видео и подписка), Лео с Анкор уходят."""
from scenes.kit import *
from scenes.shared import *


def shot_end(ctx, t, S):
    D.vgrad(ctx, 0, 0, W, H, [(0, "#14204a"), (1, "#2a3f7a")])
    SEA.stars(ctx, 0, 0, W, 700, t, 7, 0.8)
    k = clamp(t / 0.5)
    D.text(ctx, "ZOMBIE OUTBREAK  •  THE CRUISE SHIP", W / 2, 150, 40, D.FONT_TITLE, hexrgb("#4cff8a"), alpha=k,
           tracking=4)
    D.text(ctx, "THANKS FOR WATCHING", W / 2, 240, 80, D.FONT_TITLE, hexrgb("#fff6d8"), alpha=k)
    # места под конечную заставку YouTube
    D.rrect(ctx, 300, 340, 760, 428, 16, None, hexrgb("#7f8fbf"), 4, alpha=k)
    D.text(ctx, "WATCH NEXT", 680, 820, 34, D.FONT_TITLE, hexrgb("#9fb0d0"), alpha=k)
    D.circle(ctx, 1440, 554, 190, None, hexrgb("#7f8fbf"), 4, alpha=k)
    D.text(ctx, "SUBSCRIBE", 1440, 820, 34, D.FONT_TITLE, hexrgb("#9fb0d0"), alpha=k)
    # Лео и Анкор идут по нижнему краю
    w = Walk(Keys((0, -200), (S.dur, 2100, "lin")), 1050, 48, "walk", t1=S.dur + 1)
    w.draw(ctx, LEO_CAP, t, {"face": "smile"})
    draw_cat(ctx, w.x(t) + 70, 1053, 40, 1, cat_pose(t, "walk", phase=w.dist(t) * 1.3, hat=True))


def build(S):
    S.shots = [Shot(0, shot_end, "fade", 0.6)]
    S.shots[0].hide_caps = True
    S.show_day = False
    S.paper = 0.3
    S.music = "happy_end"
