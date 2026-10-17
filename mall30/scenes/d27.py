"""День 27: подготовка. Путь наверх, 60 шаров у эскалатора, 10 манекенов с телефонами. Шум — нарочно."""
from scenes.kit import *
from scenes.shared import gallery_bg, gs, GF
from sets import stores as ST

MANNEQUINS = [
    R.Look(head="#e9dcc6", body="#1f1f24", limb=hexrgb("#8a7a68"), faceless=True, details=("tie",), body2="#c23b33"),
    R.Look(head="#e9dcc6", body="#c23b6a", limb=hexrgb("#8a7a68"), faceless=True, style="dress", length=0.6),
    R.Look(head="#e9dcc6", body="#3f8a84", limb=hexrgb("#8a7a68"), faceless=True, style="coat", length=0.4),
    R.Look(head="#e9dcc6", body="#e2a33b", limb=hexrgb("#8a7a68"), faceless=True, style="dress", length=0.5),
    R.Look(head="#e9dcc6", body="#2f3d5c", limb=hexrgb("#8a7a68"), faceless=True, details=("tie",), body2="#e2a33b"),
]


def mannequin(i):
    return R.Fig(MANNEQUINS[i % len(MANNEQUINS)])


def mq_pose(t, i, phone_on=0.0):
    p = R.stand("front", 0.0, i)
    p.update(a1=(0.25, 0.1), h2=(0.35, -2.4), blink=0)
    return p


def phone_in_hand(ctx, J, on=0.0, t=0.0):
    hx, hy = J["hand2"]
    D.rrect(ctx, hx - 0.1, hy - 0.32, 0.2, 0.34, 0.04, hexrgb("#1c1c22"), D.INK, 0.025)
    D.rect(ctx, hx - 0.08, hy - 0.3, 0.16, 0.28, mix(hexrgb("#2a2a30"), hexrgb("#9fe0ff"), on), None, 0, wob=0)


def shot_route(ctx, t, S):
    """Схема: фудкорт (3 эт.) → эскалатор → 4 эт., боулинг → крыша."""
    D.col(ctx, hexrgb("#f3e7d0"))
    ctx.paint()
    D.text(ctx, "THE WAY UP", W / 2, 130, 70, D.FONT_TITLE, D.INK)
    levels = [("ROOF", 260), ("4  BOWLING", 440), ("3  FOOD COURT", 620), ("2", 800), ("B  BASEMENT", 960)]
    for nm, y in levels:
        D.rect(ctx, 360, y - 70, 1200, 140, hexrgb("#e6d8bc") if "B " not in nm else hexrgb("#6e7f8a"), D.INK, 3,
               wob=0.5)
        D.text(ctx, nm, 400, y + 14, 40, D.FONT_TITLE, D.INK, "left")
    pts = [(1300, 620), (1400, 600), (1100, 440), (1200, 420), (900, 260)]
    k = clamp(t / 2.5)
    n = 1 + int(k * (len(pts) - 1))
    D.col(ctx, hexrgb("#d9483b"))
    ctx.set_line_width(12)
    ctx.set_line_cap(cairo.LINE_CAP_ROUND)
    ctx.move_to(*pts[0])
    for p in pts[1:n + 1]:
        ctx.line_to(*p)
    ctx.stroke()
    D.circle(ctx, 1300, 620, 18, hexrgb("#d9483b"), D.INK, 3)
    D.text(ctx, "YOU", 1300, 590, 30, D.FONT_TITLE, hexrgb("#d9483b"))
    D.col(ctx, hexrgb("#3f6a8a"), 0.7)
    ctx.rectangle(362, 930 - 40 * clamp(t / 3), 1196, 98)
    ctx.fill()


def shot_balls(ctx, t, S):
    """Наверху эскалатора: шары выстраиваются в ряд, счётчик до 60."""
    n = int(clamp(t / 3.5) * 60)
    cam = Cam(1500, 330, 1.25)
    with layer(ctx, cam, t):
        bg(ctx, "esc_big", (-400, -400, 2800, 1700), ST.escalator_big)
        cols = ["#2f3d5c", "#c23b33", "#3f8a84", "#e2a33b", "#7a6aa3", "#1f1f24"]
        for k in range(min(n, 30)):
            ST.ball(ctx, 1570 + k * 34, 278, 18, cols[k % 6])
        for k in range(max(0, n - 30)):
            ST.ball(ctx, 1587 + k * 34, 246, 18, cols[(k + 3) % 6])
        p = R.stand("side", t, 1)
        roll = math.sin(t * 6)
        p.update(lean=0.45 + 0.1 * roll, h1=(0.8, -0.6), h2=(0.7, -0.55), face="determined")
        HERO.draw(ctx, 1900 + 40 * roll, 300, 82, -1, p)
    fx.grade(ctx, "overcast", 0.25)
    D.text(ctx, "%d" % n, 160, 330, 140, D.FONT_TITLE, hexrgb("#f7eedb"), "left", stroke=D.INK, slw=12)
    D.text(ctx, "BOWLING BALLS", 160, 400, 50, D.FONT_TITLE, hexrgb("#f7eedb"), "left", stroke=D.INK, slw=8)


def shot_dress(ctx, t, S):
    """Uptown Style: манекены в лучшей одежде ТЦ."""
    cam = Cam(Keys((0, 700), (4, 1100)), 560, 1.1)
    with layer(ctx, cam, t):
        D.col(ctx, hexrgb("#d8cde0"))
        ctx.paint()
        C.sign(ctx, 600, 60, 700, 90, "UPTOWN STYLE", bg="#7a6aa3", seed=3)
        D.rect(ctx, -400, 860, 2800, 500, hexrgb("#bfb4c9"), None, 0, wob=0)
        D.line(ctx, -400, 860, 2400, 860, D.INK, 3)
        for i in range(5):
            x = 300 + i * 260
            mannequin(i).draw(ctx, x, 880, 92, 1, mq_pose(t, i))
            D.rect(ctx, x - 50, 880, 100, 14, hexrgb("#8a7a68"), D.INK, 2, wob=0)
        p = R.stand("side", t, 1)
        p.update(h1=(0.6, -2.6 + 0.1 * math.sin(t * 7)), face="happy")
        HERO.draw(ctx, 1640, 900, 95, -1, p)
        D.poly(ctx, [(1520, 650), (1590, 650), (1600, 760), (1510, 760)], hexrgb("#c23b33"), D.INK, 3, wob=0)
    fx.grade(ctx, "warm", 0.1)


def shot_phones(ctx, t, S):
    """Телефоны в руках манекенов: экран загорается — «PLAY 3:00»."""
    cam = Cam(960, 520, 1.0)
    with layer(ctx, cam, t):
        D.col(ctx, hexrgb("#d8cde0"))
        ctx.paint()
        p = mq_pose(t, 0)
        mannequin(0).head_only(ctx, 720, 330, 260, 1, {"view": "front", "neck_line": True})
        D.line(ctx, 720, 600, 720, 1300, hexrgb("#8a7a68"), 26)
        D.line(ctx, 720, 700, 1080, 640, hexrgb("#8a7a68"), 24)
        D.rrect(ctx, 1040, 420, 220, 380, 30, hexrgb("#1c1c22"), D.INK, 5)
        on = clamp((t - 0.6) / 0.2)
        D.rrect(ctx, 1056, 450, 188, 320, 18, mix(hexrgb("#2a2a30"), hexrgb("#e9eef2"), on), None, 0)
        if on > 0:
            D.text(ctx, "3:00", 1150, 560, 60, D.FONT_DAY, hexrgb("#1c1c22"), bold=True)
            D.text(ctx, "VOLUME", 1150, 630, 26, D.FONT_DAY, hexrgb("#8a8d96"), bold=True)
            D.rect(ctx, 1080, 650, 140, 18, hexrgb("#d9483b"), None, 0, wob=0)
            D.poly(ctx, [(1130, 690), (1130, 750), (1180, 720)], hexrgb("#3f8ae0"), None, 0, wob=0)
            D.line(ctx, 1040, 820, 1280, 820, D.INK, 0)
        D.line(ctx, 1080, 640, 1100, 560, D.INK, 30)
    fx.grade(ctx, "warm", 0.1)
    D.text(ctx, "x10", W - 140, 220, 140, D.FONT_TITLE, hexrgb("#f7eedb"), "right", stroke=D.INK, slw=12)


def shot_rule(ctx, t, S):
    """Табличка на стене: старое правило перечёркнуто, новое дописано маркером."""
    D.col(ctx, M.WALL)
    ctx.paint()
    D.rect(ctx, 360, 180, 1200, 720, hexrgb("#f6f1e6"), D.INK, 6, wob=1.0)
    D.text(ctx, "MALL RULES", 960, 290, 70, D.FONT_TITLE, hexrgb("#2f3d5c"))
    D.text(ctx, "#1  NO NOISE.", 960, 480, 90, D.FONT_HAND, D.INK)
    k = clamp((t - 0.5) / 0.4)
    if k > 0:
        D.line(ctx, 560, 455, 560 + 800 * k, 465, hexrgb("#c23b33"), 14)
    k2 = clamp((t - 1.3) / 0.6)
    if k2 > 0:
        s = "NOISE ON PURPOSE."
        D.text(ctx, s[:int(len(s) * k2)], 960, 700, 100, D.FONT_HAND, hexrgb("#c23b33"), rot=-0.03)


def build(S):
    c = S.cue
    S.shots = [
        Shot(0, shot_route),
        Shot(c(1) - 0.1, shot_balls),
        Shot(c(2) - 0.1, shot_dress),
        Shot(c(3) - 0.1, shot_phones),
        Shot(c(4) - 0.1, shot_rule),
    ]
