"""Конечная заставка: место под элементы YouTube (видео и подписка), герой с Претцелем уходят."""
from scenes.kit import *
from scenes.shared import gs, GF


def shot_end(ctx, t, S):
    D.col(ctx, hexrgb("#1c1820"))
    ctx.paint()
    k = clamp(t / 0.5)
    D.text(ctx, "ZOMBIE OUTBREAK  •  THE MALL", W / 2, 150, 40, D.FONT_TITLE, hexrgb("#d9483b"), alpha=k,
           tracking=4)
    D.text(ctx, "THANKS FOR WATCHING", W / 2, 240, 80, D.FONT_TITLE, hexrgb("#f7eedb"), alpha=k)
    # места под конечную заставку YouTube
    D.rrect(ctx, 300, 340, 760, 428, 16, None, hexrgb("#6a6470"), 4, alpha=k)
    D.text(ctx, "WATCH NEXT", 680, 820, 34, D.FONT_TITLE, hexrgb("#8a8490"), alpha=k)
    D.circle(ctx, 1440, 554, 190, None, hexrgb("#6a6470"), 4, alpha=k)
    D.text(ctx, "SUBSCRIBE", 1440, 820, 34, D.FONT_TITLE, hexrgb("#8a8490"), alpha=k)
    # герой и Претцель идут по нижнему краю
    w = Walk(Keys((0, -200), (S.dur, 2100, "lin")), 1050, 48, "walk", t1=S.dur + 1)
    w.draw(ctx, HERO, t, {"face": "smile"})
    draw_dog(ctx, w.x(t) + 70, 1053, 44, 1, dog_pose(t, "trot", phase=w.dist(t) * 1.3))


def build(S):
    S.shots = [Shot(0, shot_end, "fade", 0.6)]
    S.shots[0].hide_caps = True
    S.show_day = False
    S.paper = 0.3
