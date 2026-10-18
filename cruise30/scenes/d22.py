"""День 22: флот отвечает. Катер «Вэлиант» придёт на рассвете тридцатого, но на борт не поднимется.
План на чертеже: гудок → все на нос, тарзанка → Бордвок, бегом на корму, гидроцикл. Каждую ночь —
репетиция. Сорок одна секунда."""
from scenes.kit import *
from scenes.shared import *
from scenes.d15 import clock_badge

BP = hexrgb("#1d4f8f")
BPL = hexrgb("#dceaff")


def blueprint_ship(ctx, x, y, s):
    """Лайнер-чертёж: белые линии на синем."""
    ctx.save()
    ctx.translate(x, y)
    ctx.scale(s, s)
    D.col(ctx, BPL)
    ctx.set_line_width(3 / s)
    hull = [(-1205, -150), (1150, -150), (1265, -165), (1215, -60), (1150, 10), (-1180, 10), (-1210, -60)]
    D.path(ctx, hull)
    ctx.stroke()
    for k in range(9):
        y0 = -235 - k * 41
        ctx.move_to(-1120 + (40 if k > 5 else 0), y0)
        ctx.line_to(1010 - k * 14, y0)
    ctx.stroke()
    ctx.rectangle(-880, -563, 240, 330)
    ctx.stroke()
    D.path(ctx, [(-310, -563), (-350, -790), (-90, -832), (-60, -563)])
    ctx.stroke()
    ctx.rectangle(690, -633, 270, 70)
    ctx.stroke()
    ctx.restore()


def shot_answer(ctx, t, S):
    cam = Cam(Keys((0, 1900), (3, 1950)), 560, Keys((0, 1.4), (3, 1.55)))
    bridge_back(ctx, t, cam, "dusk", 0.0, sun=(2300, 560, 60), battery=31, autopilot=False)
    with layer(ctx, cam, t):
        BR.radio_lit(ctx, t, 0.8)
        jump = abs(math.sin(t * 6)) * 40 * clamp((t - 0.6) / 0.2)
        p = R.stand("side", t, 1)
        p.update(face="laugh" if t > 0.6 else "shock", a1=(2.7, 0.3), a2=(2.5, 0.3), hturn=0.6)
        LEO_CAP.draw(ctx, 1800, BR.BF + 40 - jump, 120, 1, p)
    pop_text(ctx, "THE NAVY ANSWERS!", W / 2, 230, t, 0.3, 100, "#ffe36a", dur=3, shake=False)


def shot_cutter(ctx, t, S):
    cam = Cam(Keys((0, 600), (5, 900)), 520, 0.85)
    sea_back(ctx, t, cam, "dawn", sun=(1600, 560, 80), hy=640, p=0.3)
    with layer(ctx, cam, t):
        cx = 400 + t * 120
        SEA.cutter(ctx, cx, 700, 1.4, 1)
        for k in range(20):
            u = k / 20
            D.ellipse(ctx, cx - 460 - u * 700, 706, 40 + 120 * u, 6 + 8 * u, (1, 1, 1), None, 0, alpha=0.5 * (1 - u))
        OD.flag(ctx, cx - 120, 330, t, "#e8423c", 90, 50)
    D.rrect(ctx, W / 2 - 430, 120, 860, 140, 30, hexrgb("#fff6d8"), D.INK, 6)
    D.text(ctx, "USCGC VALIANT", W / 2, 185, 66, D.FONT_TITLE, hexrgb("#1c3f7c"))
    D.text(ctx, "DAY 30 · DAWN", W / 2, 240, 44, D.FONT_TITLE, hexrgb("#e8423c"))


def shot_no_board(ctx, t, S):
    cam = Cam(900, 520, 1.0)
    sea_back(ctx, t, cam, "dawn", sun=(1600, 560, 80), hy=640, p=0.3)
    with layer(ctx, cam, t):
        SEA.cutter(ctx, 1400, 700, 1.0, -1)
        ctx.save()
        ctx.translate(-700, 0)
        bg(ctx, "ship_dawn_small", (-760, 200, 1520, 560), lambda c: SH.ship_side(c, 0, 700, 0.5, "dawn", 0.0))
        ctx.restore()
        n = int(clamp(t / 1.2) * 14)
        for i in range(n):
            x = -150 + i * 90
            D.line(ctx, x, 690, x + 50, 690, hexrgb("#ffffff"), 6)
    k = ease_out_back(clamp((t - 0.3) / 0.3))
    if k > 0:
        ctx.save()
        ctx.translate(1500, 300)
        ctx.rotate(0.05)
        ctx.scale(k, k)
        D.rrect(ctx, -260, -80, 520, 160, 20, hexrgb("#e8423c"), D.INK, 6)
        D.text(ctx, "NO BOARDING", 0, 22, 66, D.FONT_TITLE, hexrgb("#fff6d8"))
        ctx.restore()
    if t > 1.4:
        pop_text(ctx, "COME TO US", 760, 320, t, 1.4, 80, "#fff6d8", dur=3, shake=False)


STEPS = [("1", "HORN", "#e8423c"), ("2", "ZIP LINE", "#f2c230"), ("3", "RUN", "#3fbf6a"), ("4", "JET SKI", "#2f8fd8")]


def plan_board(ctx, t, upto=2, dot_k=0.0):
    D.rect(ctx, 0, 0, W, H, BP, None, 0, wob=0)
    D.col(ctx, (1, 1, 1), 0.08)
    ctx.set_line_width(2)
    for x in range(0, W, 60):
        ctx.move_to(x, 0)
        ctx.line_to(x, H)
    for y in range(0, H, 60):
        ctx.move_to(0, y)
        ctx.line_to(W, y)
    ctx.stroke()
    sx, sy, s = W / 2 - 40, 800, 0.66
    blueprint_ship(ctx, sx, sy, s)
    P = lambda lx, ly: (sx + lx * s, sy + ly * s)
    # 1: гудок — стрелки толпы к носу
    if upto >= 1:
        hx, hy = P(-180, -830)
        D.circle(ctx, hx, hy, 26, hexrgb("#e8423c"), D.INK, 3)
        for i in range(5):
            ax = P(-600 + i * 260, -600)
            D.line(ctx, ax[0], ax[1], ax[0] + 120, ax[1], hexrgb("#e8423c"), 6, 0.8)
            D.poly(ctx, [(ax[0] + 120, ax[1] - 14), (ax[0] + 146, ax[1]), (ax[0] + 120, ax[1] + 14)], hexrgb("#e8423c"),
                   None, 0, wob=0)
    route = [P(-180, -800), P(-880, -560), P(-760, -260), P(-1150, -200), P(-1240, 0)]
    for i in range(min(upto, 4)):
        if i == 0:
            continue
        a, b = route[i], route[i + 1]
        n = 12
        for j in range(n):
            if j % 2 == 0:
                D.line(ctx, lerp(a[0], b[0], j / n), lerp(a[1], b[1], j / n), lerp(a[0], b[0], (j + 1) / n),
                       lerp(a[1], b[1], (j + 1) / n), hexrgb(STEPS[i][2]), 7)
    for i in range(upto):
        num, name, c = STEPS[i]
        x, y = 520 + i * 360, 250
        D.circle(ctx, x, y, 44, hexrgb(c), D.INK, 4)
        D.text(ctx, num, x, y + 22, 60, D.FONT_TITLE, hexrgb("#fff6d8"))
        D.text(ctx, name, x + 70, y + 20, 54, D.FONT_TITLE, BPL, "left")
    if dot_k > 0:
        u = clamp(dot_k) * 4
        i = min(3, int(u))
        a, b = route[i], route[i + 1]
        k = u - i
        x, y = lerp(a[0], b[0], k), lerp(a[1], b[1], k)
        fx.glow(ctx, x, y, 60, "#ffffff", 0.8)
        LEO_CAP.head_only(ctx, x, y - 20, 50, 1, {"view": "front", "face": "determined", "neck_line": False})


def shot_plan(ctx, t, S):
    d = S.cue(4) - S.cue(3)
    plan_board(ctx, t, upto=1 + int(clamp(t / d) * 2.0 + 0.4))


def shot_plan2(ctx, t, S):
    plan_board(ctx, t, upto=4, dot_k=clamp(t / 2.4))
    if t > 2.2:
        pop_text(ctx, "GO!", W - 300, 420, t, 2.2, 160, "#ffe36a", dur=2)


def shot_rehearse(ctx, t, S):
    cam = Cam(Keys((0, 2400), (5, 1400)), 760, 0.9)
    deck_back(ctx, t, cam, "night", 0.0, moon=(2800, -150, 45))
    with layer(ctx, cam, t):
        w = Walk(Keys((0, 3000), (4.0, 900, "lin")), 1020, 110, "run", t1=6)
        w.draw(ctx, LEO_CAP, t, {"face": "determined"})
        draw_cat(ctx, 3100, DK.GF + 20, 85, -1, cat_pose(t, "sit"))
    fx.darkness(ctx, 0.3, [fx.Light(W / 2, 300, 1100, power=0.6, glow_a=0.0)])
    sec = min(41.0, t * 10.5)
    D.rrect(ctx, W - 470, 100, 400, 150, 30, hexrgb("#0e1410"), D.INK, 6)
    D.text(ctx, "0:%02d" % int(sec), W - 270, 210, 100, D.FONT_TITLE, hexrgb("#4cff8a"))
    nights = ["NIGHT 22", "NIGHT 23", "NIGHT 24"]
    D.text(ctx, nights[min(2, int(t / 1.6))], 300, 210, 60, D.FONT_TITLE, hexrgb("#cfe0ff"), stroke=D.INK, slw=6)


def build(S):
    c = S.cue
    S.shots = [
        Shot(0, shot_answer),
        Shot(c(1) - 0.1, shot_cutter, "fade", 0.3),
        Shot(c(2) - 0.1, shot_no_board),
        Shot(c(3) - 0.1, shot_plan, "fade", 0.3),
        Shot(c(4) - 0.1, shot_plan2),
        Shot(c(5) - 0.1, shot_rehearse, "fade", 0.3),
    ]
    S.tods = [(0, "dusk"), (c(1), "dawn"), (c(3), "night")]
    S.sfx += [(0.3, "radio_beep", 0.8), (c(4) + 2.2, "ding", 0.9), (c(5), "stopwatch", 0.7)]
    S.music = "plan"
