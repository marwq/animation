"""День 15: полпути, распорядок. 7:00 — отжимания на вертолётной площадке, 9:00 — швабра на мостике,
12:00 — рыбалка (рыбу крадёт Анкор), 18:00 — закат на трубе рядом с латунным гудком на цепи,
21:00 — шахматы с Долорес по радио."""
from scenes.kit import *
from scenes.shared import *
from scenes.d06 import dolores_at_radio, leo_mic


def clock_badge(ctx, txt, t, x=W - 260, y=150):
    k = ease_out_back(clamp(t / 0.3))
    ctx.save()
    ctx.translate(x, y)
    ctx.scale(k, k)
    D.rrect(ctx, -170, -65, 340, 130, 26, hexrgb("#0e1410"), D.INK, 6)
    D.text(ctx, txt, 0, 34, 88, D.FONT_TITLE, hexrgb("#ff4a3a"))
    ctx.restore()


def shot_halfway(ctx, t, S):
    D.vgrad(ctx, 0, 0, W, H, [(0, "#16a39a"), (1, "#0f6a7a")])
    k = smooth(clamp((t - 0.4) / 1.4))
    D.text(ctx, "HALFWAY", W / 2, 380, 150, D.FONT_TITLE, hexrgb("#fff6d8"), stroke=D.INK, slw=14)
    D.rrect(ctx, 360, 520, 1200, 110, 55, hexrgb("#0e3a40"), D.INK, 8)
    D.rrect(ctx, 372, 532, max(80, 1176 * 0.5 * k), 86, 43, hexrgb("#ffe36a"), None, 0)
    D.text(ctx, "%d / 30" % int(1 + 14 * k), W / 2, 760, 90, D.FONT_TITLE, hexrgb("#fff6d8"), stroke=D.INK, slw=10)
    for i in range(30):
        x = 390 + i * 39
        D.line(ctx, x, 640, x, 660, D.INK, 4)


def shot_pushups(ctx, t, S):
    cam = Cam(1700, 760, Keys((0, 1.1), (3, 1.2)))
    sea_back(ctx, t, cam, "morning", sun=(600, 300, 70), hy=500)
    with layer(ctx, cam, t):
        bg(ctx, "bow_morning", (-1000, -400, 4800, 1900), lambda c: OD.bow(c, "morning"))
        k = 0.5 + 0.5 * math.sin(t * 5)
        ang = 1.32 + 0.1 * k
        fx_, fy_ = 1400, OD.OF + 60
        p = R.stand("side", t, 1)
        p.update(face="determined", hturn=0.9, h1=(0.75, -2.55 + 0.25 * k), h2=(0.7, -2.5 + 0.25 * k))
        ctx.save()
        ctx.translate(fx_, fy_)
        ctx.rotate(ang)
        LEO_CAP.draw(ctx, 0, 0, 110, 1, p)
        ctx.restore()
        # кошка сидит у него на спине
        lx, ly = -0.32 * 110, -2.1 * 110
        ca, sa = math.cos(ang), math.sin(ang)
        bx, by = fx_ + lx * ca - ly * sa, fy_ + lx * sa + ly * ca
        draw_cat(ctx, bx, by, 80, 1, cat_pose(t, "sit"))
    clock_badge(ctx, "07:00", t)
    n = int(t * 5 / TAU * 1) + 1
    D.text(ctx, str(n * 1 + 12), 400, 300, 160, D.FONT_TITLE, hexrgb("#ffe36a"), stroke=D.INK, slw=12)


def shot_mop(ctx, t, S):
    cam = Cam(Keys((0, 1200), (3, 1300)), 600, 1.25)
    bridge_back(ctx, t, cam, "day", 0.0, sun=(1700, 150, 50), battery=58, autopilot=False)
    with layer(ctx, cam, t):
        sw = math.sin(t * 5)
        p = R.stand("side", t, 1)
        p.update(face="smile", h1=(0.65 + 0.35 * sw, -1.6), h2=(0.3 + 0.2 * sw, -2.5), lean=0.15)
        LEO_CAP.draw(ctx, 1250 + 30 * sw, BR.BF + 40, 120, 1, p,
                     extra=lambda c, J, l: mop(c, J, "hand1", "hand2") if l == "front" else None)
        for i in range(5):
            D.ellipse(ctx, 1150 + i * 90, BR.BF + 50, 50, 10, hexrgb("#9fd8ec"), None, 0, alpha=0.6)
        draw_cat(ctx, 1650, BR.BF + 40, 95, -1, cat_pose(t, "sit"))
    clock_badge(ctx, "09:00", t)
    pop_text(ctx, "STILL THE BUSBOY", 600, 230, t, 0.4, 70, "#fff6d8", dur=3, shake=False)


def shot_fish(ctx, t, S):
    T_BITE, T_STEAL = 0.9, 1.9
    cam = Cam(1000, 600, 1.05)
    sea_back(ctx, t, cam, "day", sun=(1600, 150, 60), hy=560)
    with layer(ctx, cam, t):
        D.rect(ctx, -400, 960, 2800, 400, hexrgb("#aeb6bc"), D.INK, 4, wob=0)
        OD.railing(ctx, -400, 2400, 960, "day", h=120, glass=False)
        p = R.stand("side", t, 1)
        pull = clamp((t - T_BITE) / 0.3)
        p.update(face="happy" if t > T_BITE else "neutral", h1=(0.7, -2.6 - 0.6 * pull), h2=(0.5, -2.2 - 0.4 * pull),
                 lean=-0.15 * pull)
        J = LEO_CAP.draw(ctx, 700, 960, 115, 1, p)
        hx, hy = LEO_CAP.world(700, 960, 115, 1, J["hand1"])
        tip = (hx + 420, hy - 260 - 120 * pull)
        D.line(ctx, hx - 40, hy + 40, tip[0], tip[1], hexrgb("#7a4a2a"), 8)
        if t < T_STEAL:
            fy = lerp(1100, tip[1] + 200, ease_out(pull))
            D.line(ctx, tip[0], tip[1], tip[0] + 20, fy, D.INK, 2)
            if t > T_BITE:
                ctx.save()
                ctx.translate(tip[0] + 20, fy + 30)
                ctx.rotate(math.pi / 2 + math.sin(t * 20) * 0.3)
                D.ellipse(ctx, 0, 0, 50, 22, hexrgb("#4fb3d9"), D.INK, 3)
                D.poly(ctx, [(-48, 0), (-75, -20), (-75, 20)], hexrgb("#4fb3d9"), D.INK, 3, wob=0)
                ctx.restore()
        # кошка
        if t < T_STEAL - 0.4:
            draw_cat(ctx, 400, 960, 90, 1, cat_pose(t, "sit"))
        elif t < T_STEAL:
            k = (t - (T_STEAL - 0.4)) / 0.4
            draw_cat(ctx, lerp(400, tip[0], k), 960 - math.sin(math.pi * k) * 420, 90, 1, cat_pose(t, "jump", jump=k,
                                                                                               height=0))
        else:
            k = clamp((t - T_STEAL) / 1.2)
            cx = lerp(tip[0], -300, k)
            draw_cat(ctx, cx, 960, 90, -1, cat_pose(t, "run", phase=t * 3))
            ctx.save()
            ctx.translate(cx - 70, 900)
            D.ellipse(ctx, 0, 0, 45, 18, hexrgb("#4fb3d9"), D.INK, 3)
            ctx.restore()
    clock_badge(ctx, "12:00", t)
    if t > T_STEAL:
        pop_text(ctx, "HEY!", 900, 300, t, T_STEAL, 120, "#fff6d8", dur=1.2)


def shot_funnel(ctx, t, S):
    cam = Cam(Keys((0, 900), (5, 1100)), Keys((0, 380), (5, 420)), Keys((0, 1.0), (5, 1.25)))
    sea_back(ctx, t, cam, "sunset", sun=(1700, 700, 90), hy=900, p=0.2)
    with layer(ctx, cam, t):
        bg(ctx, "funnel_sunset", (-500, 0, 3000, 1300), lambda c: OD.funnel_top(c, "sunset"))
        p = sit_pose(t, 1, "smile", seat=0.0)
        p.update(f1=(0.8, 0.0), f2=(0.7, 0.0), a1=(-0.3, 0.3), hturn=0.8)
        LEO_CAP.draw(ctx, 800, OD.FTOP - 20, 105, 1, p)
        draw_cat(ctx, 640, OD.FTOP - 20, 85, 1, cat_pose(t, "lie"))
    fx.glow(ctx, *cam.to_screen(t, 1700, 700), 900, "#ffb03c", 0.25)
    clock_badge(ctx, "18:00", t)
    if t > 1.6:
        x, y = cam.to_screen(t, 1370, OD.FTOP - 160)
        k = ease_out_back(clamp((t - 1.6) / 0.35))
        ctx.save()
        ctx.translate(x + 300, y - 260)
        ctx.scale(k, k)
        D.rrect(ctx, -260, -60, 520, 120, 24, hexrgb("#fff6d8"), D.INK, 5)
        D.text(ctx, "BRASS HORN", 0, -4, 50, D.FONT_TITLE, D.INK)
        D.text(ctx, "NO POWER NEEDED", 0, 40, 34, D.FONT_TITLE, hexrgb("#c23b33"))
        ctx.restore()
        D.line(ctx, x + 120, y - 200, x + 30, y - 40, D.INK, 8)
        D.line(ctx, x + 120, y - 200, x + 30, y - 40, hexrgb("#fff6d8"), 4)


def chess(ctx, t, x, y, s=1.0):
    ctx.save()
    ctx.translate(x, y)
    ctx.scale(s, s)
    D.rect(ctx, -170, -170, 340, 340, hexrgb("#f4ead2"), D.INK, 6, wob=0)
    for i in range(8):
        for j in range(8):
            if (i + j) % 2:
                D.rect(ctx, -170 + i * 42.5, -170 + j * 42.5, 42.5, 42.5, hexrgb("#8a5a3a"), None, 0, wob=0)
    for (i, j, c) in ((1, 1, "#ffffff"), (2, 6, "#2a2220"), (4, 3, "#ffffff"), (6, 5, "#2a2220"), (5, 1, "#2a2220")):
        D.circle(ctx, -148 + i * 42.5, -148 + j * 42.5, 15, hexrgb(c), D.INK, 3)
    ctx.restore()


def shot_chess(ctx, t, S):
    camL = Cam(2240, 560, 1.4)
    camR = Cam(30, 650, 1.5)
    diag_split(ctx, lambda c: leo_mic(c, t, camL, "worried" if t < 2.4 else "sad", 0.0),
               lambda c: dolores_at_radio(c, t, camR, 1.0, "laugh", cup=True), 1.0)
    chess(ctx, t, W / 2, H / 2 + 60, 1.0)
    clock_badge(ctx, "21:00", t)
    if t > 2.2:
        pop_text(ctx, "CHECKMATE.", W / 2, 260, t, 2.2, 100, "#ffe36a", dur=2.5)


def build(S):
    c = S.cue
    t_mop = c(1) + 2.6
    S.shots = [
        Shot(0, shot_halfway),
        Shot(c(1) - 0.1, shot_pushups, "whip", 0.3),
        Shot(t_mop, shot_mop, "whip", 0.3),
        Shot(c(2) - 0.1, shot_fish, "whip", 0.3),
        Shot(c(3) - 0.1, shot_funnel, "whip", 0.3),
        Shot(c(4) - 0.1, shot_chess, "whip", 0.3),
    ]
    S.tods = [(0, "day"), (c(3), "dusk"), (c(4), "night")]
    S.sfx += [(c(2) + 1.8, "meow", 0.9), (c(4) + 2.2, "laugh_old", 0.7)]
    S.music = "routine"
