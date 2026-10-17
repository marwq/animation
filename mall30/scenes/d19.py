"""День 19: день рождения Лили. Провалившийся торт, девять свечей, «HAPPY BIRTHDAY LILY» в окне Розы."""
from scenes.kit import *
from scenes.shared import binocular, rosa_window_close
from scenes.cold import _fc, fs


def photo(ctx, x, y, s=1.0, rot=-0.06, t=0.0):
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(rot)
    ctx.scale(s, s)
    D.rect(ctx, -180, -220, 360, 420, hexrgb("#f6f1e6"), D.INK, 4, wob=0.4)
    D.rect(ctx, -150, -190, 300, 290, hexrgb("#bfe0f0"), D.INK, 3, wob=0)
    ctx.save()
    ctx.rectangle(-150, -190, 300, 290)
    ctx.clip()
    p = R.stand("front", t, 6)
    p.update(face="happy", a2=(2.6, 0.3), blink=0)
    LILY.draw(ctx, 0, 230, 105, 1, p)
    ctx.restore()
    D.text(ctx, "LILY", 0, 160, 54, D.FONT_HAND, hexrgb("#1f2a55"))
    ctx.restore()


def shot_photo(ctx, t, S):
    cam = Cam(960, 540, Keys((0, 1.0), (4, 1.15)))
    with layer(ctx, cam, t):
        D.col(ctx, hexrgb("#a86a4a"))
        ctx.paint()
        D.col(ctx, hexrgb("#9a5f42"))
        ctx.set_line_width(4)
        for y in range(0, 1200, 90):
            ctx.move_to(-200, y)
            ctx.line_to(2200, y + 20)
        ctx.stroke()
        photo(ctx, 760, 560, 1.4, t=t)
        D.circle(ctx, 1380, 520, 150, None, hexrgb("#c23b33"), 10)
        D.text(ctx, "9", 1380, 590, 220, D.FONT_TITLE, hexrgb("#f7eedb"), stroke=D.INK, slw=12)
    fx.grade(ctx, "warm", 0.25)
    D.text(ctx, "LILY'S BIRTHDAY", W / 2, 150, 80, D.FONT_TITLE, hexrgb("#f7eedb"), stroke=D.INK, slw=10,
           alpha=clamp((t - 0.4) / 0.3))


def cake(ctx, x, y, s=1.0, rise=1.0, collapse=0.0, candles=0, lit=True, t=0.0, smoke=0.0):
    ctx.save()
    ctx.translate(x, y)
    ctx.scale(s, s)
    D.ellipse(ctx, 0, 0, 200, 40, hexrgb("#f4efe4"), D.INK, 4)
    h = 140 * rise
    dip = 70 * collapse
    D.col(ctx, hexrgb("#e9c48a"))
    ctx.move_to(-170, -10)
    ctx.line_to(-170, -10 - h)
    ctx.curve_to(-60, -10 - h + dip * 1.3, 60, -10 - h + dip * 1.3, 170, -10 - h)
    ctx.line_to(170, -10)
    ctx.close_path()
    ctx.fill_preserve()
    D.col(ctx, D.INK)
    ctx.set_line_width(4)
    ctx.stroke()
    D.col(ctx, hexrgb("#f7d0d8"))
    ctx.set_line_width(14)
    ctx.move_to(-170, -10 - h)
    ctx.curve_to(-60, -10 - h + dip * 1.3, 60, -10 - h + dip * 1.3, 170, -10 - h)
    ctx.stroke()
    for k in range(candles):
        cx = -140 + k * 35
        fcurve = (cx / 170) ** 2
        cy = -10 - h + dip * 1.3 * (1 - fcurve) * 0.75
        D.rect(ctx, cx - 6, cy - 60, 12, 60, hexrgb("#7fb7d8") if k % 2 else hexrgb("#f2b84b"), D.INK, 2, wob=0)
        if lit:
            fl = 1 + 0.2 * math.sin(t * 20 + k)
            D.ellipse(ctx, cx, cy - 76, 8, 14 * fl, hexrgb("#ffd36a"), None, 0)
        elif smoke > 0:
            ph = smoke
            D.curve(ctx, [(cx, cy - 64), (cx + 10, cy - 64 - 40 * ph), (cx - 6, cy - 64 - 80 * ph)], hexrgb("#c9c4ba"),
                    3, alpha=1 - ph)
    ctx.restore()


def shot_bake(ctx, t, S):
    """Торт поднимается... и проваливается в середине."""
    cam = Cam(960, 620, Keys((0, 1.4), (5, 1.6)))
    with layer(ctx, cam, t):
        bg(ctx, "fc_night", (-400, 0, 2800, 1300), _fc)
        M.table_set(ctx, 960, 1000, fs(1000) / 62)
        rise = smooth(t / 2.0)
        col = smooth((t - 2.6) / 0.6)
        cake(ctx, 1000, 760, 0.9, rise, col)
        p = R.stand("side", t, 1)
        p.update(face="happy" if t < 2.6 else "sad", lean=0.2, h1=(0.85, -1.85), hturn=0.6)
        HERO.draw(ctx, 690, 985, fs(985), 1, p)
    fx.darkness(ctx, 0.55, [fx.Light(*cam.to_screen(t, 1000, 700), 700, power=0.8, glow="#ffd9a0", glow_a=0.2)])
    if t > 3.0:
        D.text(ctx, "*plop*", W / 2 + 280, 330, 70, D.FONT_HAND, hexrgb("#f7eedb"), stroke=D.INK, slw=8,
               alpha=clamp(2 - (t - 3.0)))


def shot_sing(ctx, t, S):
    """Девять свечей. Поёт фото тихо — свечи освещают лицо."""
    cam = Cam(960, 560, Keys((0, 1.1), (5, 1.3)))
    with layer(ctx, cam, t):
        D.col(ctx, hexrgb("#16131c"))
        ctx.paint()
        cake(ctx, 1180, 880, 1.1, 1.0, 1.0, candles=9, t=t)
        photo(ctx, 1560, 640, 0.6, 0.1, t)
        p = {"view": "front", "face": "smile", "mouth": 0.3 + 0.3 * abs(math.sin(t * 5)), "hturn": 0.6,
             "neck_line": True, "blink": R.blink(t, 2), "look": (0.8, 0.4)}
        HERO.head_only(ctx, 650, 500, 300, 1, p)
        from scenes.d01 import music_notes
        music_notes(ctx, 900, 380, t, 1.2, 0.6)
    fx.darkness(ctx, 0.55, [fx.Light(*cam.to_screen(t, 1180, 700), 900, power=0.9, glow="#ffcf80", glow_a=0.35)])


def shot_sign(ctx, t, S):
    def scene(c):
        p = R.stand("front", t, 4)
        p.update(h1=(-0.8, -2.9), h2=(0.8, -2.9), face="happy")
        rosa_window_close(c, t, "dusk", sign=["HAPPY", "BIRTHDAY", "LILY!"], sign_k=clamp(t / 0.3),
                          pose_fn=lambda tt: p, light=0.9)
        from sets import stores as ST
        for k, (bx, by, cc) in enumerate([(620, 330, "#c23b33"), (1300, 300, "#e2a33b"), (700, 460, "#3f8a84")]):
            ST.balloon(c, bx, by + math.sin(t * 2 + k) * 10, 50, cc, string=200)
    binocular(ctx, scene, t)


def shot_blow(ctx, t, S):
    """Задувает свечи — дымки. Улыбка сквозь слёзы."""
    T = 0.9
    cam = Cam(960, 560, Keys((0, 1.3), (4, 1.2)))
    lit = t < T
    with layer(ctx, cam, t):
        D.col(ctx, hexrgb("#16131c"))
        ctx.paint()
        cake(ctx, 1180, 880, 1.1, 1.0, 1.0, candles=9, lit=lit, t=t, smoke=clamp((t - T) / 1.5))
        p = {"view": "front", "face": "cry" if t > T + 0.4 else "smile", "mouth": 0.6 if 0.4 < t < T else 0.0,
             "hturn": 0.6, "neck_line": True, "tears_t": t * 0.6, "look": (0.8, 0.4)}
        if t > T + 0.4:
            p["face"] = "happy"
            p["tears"] = 1
        HERO.head_only(ctx, 650, 500, 300, 1, p)
        if 0.4 < t < T:
            for k in range(5):
                D.line(ctx, 830 + k * 40, 560, 900 + k * 50, 600 + k * 8, hexrgb("#e9eef2"), 4, alpha=0.6)
    if lit:
        fx.darkness(ctx, 0.55, [fx.Light(*cam.to_screen(t, 1180, 700), 900, power=0.9, glow="#ffcf80", glow_a=0.35)])
    else:
        fx.darkness(ctx, 0.7, [fx.Light(*cam.to_screen(t, 1180, 700), 500, power=0.5, glow_a=0.05)])


def build(S):
    c = S.cue
    S.shots = [
        Shot(0, shot_photo),
        Shot(c(1) - 0.1, shot_bake),
        Shot(c(2) - 0.1, shot_sing),
        Shot(c(3) - 0.1, shot_sign),
        Shot(c(4) - 0.1, shot_blow),
    ]
    S.tods = [(0, "dusk"), (c(2), "night")]
