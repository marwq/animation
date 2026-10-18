"""Конечная заставка: место под элементы YouTube (видео и подписка), Рози с Дэнни и Пиклз пролетает."""
from scenes.kit import *
from scenes.shared import *


def shot_end(ctx, t, S):
    D.vgrad(ctx, 0, 0, W, H, [(0, "#14204a"), (1, "#2a3f7a")])
    SEA.stars(ctx, 0, 0, W, 700, t, 7, 0.8)
    k = clamp(t / 0.5)
    D.text(ctx, "ZOMBIE OUTBREAK  •  THE AIRPORT", W / 2, 150, 40, D.FONT_TITLE, hexrgb("#4cff8a"), alpha=k,
           tracking=4)
    D.text(ctx, "THANKS FOR WATCHING", W / 2, 240, 80, D.FONT_TITLE, hexrgb("#fff6d8"), alpha=k)
    # места под конечную заставку YouTube
    D.rrect(ctx, 300, 340, 760, 428, 16, None, hexrgb("#7f8fbf"), 4, alpha=k)
    D.text(ctx, "WATCH NEXT", 680, 820, 34, D.FONT_TITLE, hexrgb("#9fb0d0"), alpha=k)
    D.circle(ctx, 1440, 554, 190, None, hexrgb("#7f8fbf"), 4, alpha=k)
    D.text(ctx, "SUBSCRIBE", 1440, 820, 34, D.FONT_TITLE, hexrgb("#9fb0d0"), alpha=k)
    # Рози пролетает по нижнему краю
    x = -300 + t / S.dur * (W + 600)
    y = 1040 + math.sin(t * 2) * 10

    def cab(c):
        DANNY_PILOT.head_only(c, 236, -178, 50, 1, {"view": "side", "face": "smile", "neck_line": False})
        draw_lab(c, 120, -150, 40, 1, dog_pose(t, "sit", headset=1.9))
    PL.rosie(ctx, x, y, 0.38, 1, "night", spin=1.0, prop=t * 40, shadow=False, cabin=cab)


def build(S):
    S.shots = [Shot(0, shot_end, "fade", 0.6)]
    S.shots[0].hide_caps = True
    S.show_day = False
    S.paper = 0.3
    S.music = "happy_end"
