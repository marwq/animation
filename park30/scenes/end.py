"""Конечная заставка: место под элементы YouTube (видео и подписка); шар с семьёй енотов пролетает по низу."""
from scenes.kit import *
from scenes.shared import *


def shot_end(ctx, t, S):
    D.vgrad(ctx, 0, 0, W, H, [(0, "#14204a"), (1, "#2a3f7a")])
    SEA.stars(ctx, 0, 0, W, 700, t, 7, 0.8)
    k = clamp(t / 0.5)
    D.text(ctx, "ZOMBIE OUTBREAK  •  THE THEME PARK", W / 2, 150, 40, D.FONT_TITLE, hexrgb("#4cff8a"), alpha=k,
           tracking=4)
    D.text(ctx, "THANKS FOR WATCHING", W / 2, 240, 80, D.FONT_TITLE, hexrgb("#fff6d8"), alpha=k)
    # места под конечную заставку YouTube
    D.rrect(ctx, 300, 340, 760, 428, 16, None, hexrgb("#7f8fbf"), 4, alpha=k)
    D.text(ctx, "WATCH NEXT", 680, 820, 34, D.FONT_TITLE, hexrgb("#9fb0d0"), alpha=k)
    D.circle(ctx, 1440, 554, 190, None, hexrgb("#7f8fbf"), 4, alpha=k)
    D.text(ctx, "SUBSCRIBE", 1440, 820, 34, D.FONT_TITLE, hexrgb("#9fb0d0"), alpha=k)
    # шар пролетает по нижнему краю
    x = -200 + t / S.dur * (W + 400)
    y = 1060 + math.sin(t * 2) * 10
    ctx.save()
    ctx.translate(x, y)
    ctx.scale(0.17, 0.17)
    e = BL.envelope(ctx, 0, -(300 + 420), 0.85, 1.0, "night", t=t, glow=0.6)

    def inside(c, bx, rim, s):
        draw_raccoon(c, bx - 60, rim + 10, 160, 1, raccoon_pose(t, "sit", look=0.3))
        for b in range(3):
            draw_raccoon(c, bx + 30 + b * 60, rim, 100, 1, raccoon_pose(t + b, "peek", baby=True))
    BL.basket(ctx, 0, 0, 1.0, "night", 0.6, t, cables_to=(e["left"][0], e["left"][1], e["right"][0], e["right"][1]),
              inside=inside)
    ctx.restore()


def build(S):
    S.shots = [Shot(0, shot_end, "fade", 0.6)]
    S.shots[0].hide_caps = True
    S.show_day = False
    S.paper = 0.3
    S.music = "happy_end"
