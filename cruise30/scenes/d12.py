"""День 12: письмо «Мама, Макс, не волнуйтесь, теперь я капитан». Воспоминание: Макс отдаёт свою
рацию «на случай, если корабль утонет». Две мили против четырёхсот. Бутылка, слёзы, Анкор бодает
в подбородок — и бах: лицо в окошке двери. Стекло выдерживает."""
from scenes.kit import *
from scenes.shared import *
from scenes.d06 import caribbean_map

MOON = (2000, 150, 40)


def night_bridge(ctx, t, cam, door_glass=True):
    bridge_back(ctx, t, cam, "night", 0.0, moon=MOON, battery=82, autopilot=False, door_glass=door_glass)


def shot_letter(ctx, t, S):
    d = S.cue(1) - 0.1
    D.vgrad(ctx, 0, 0, W, H, [(0, "#2a2448"), (1, "#141030")])
    ctx.save()
    ctx.translate(W / 2, H / 2 + 30)
    ctx.rotate(-0.03)
    D.rect(ctx, -560, -380, 1120, 760, hexrgb("#fbf3dc"), D.INK, 6, wob=0)
    lines = ["Dear Mom.", "Dear Max.", "Don't worry.", "I'm the captain now.", "                    — Leo"]
    tl = [0.0, 1.0, 2.0, 3.1, d - 1.2]
    for i, (txt, t0) in enumerate(zip(lines, tl)):
        n = int(clamp((t - t0) / 0.9) * len(txt))
        D.text(ctx, txt[:n], -460, -230 + i * 130, 92, D.FONT_HAND, hexrgb("#2a3a7a"), "left")
    # карандаш
    i = max(0, min(4, sum(1 for t0 in tl if t > t0) - 1))
    txt = lines[i]
    n = int(clamp((t - tl[i]) / 0.9) * len(txt))
    px = -460 + D.text_width(ctx, txt[:n], 92, D.FONT_HAND) + math.sin(t * 30) * 4
    py = -230 + i * 130
    D.line(ctx, px, py - 10, px + 160, py - 170, D.INK, 26)
    D.line(ctx, px, py - 10, px + 160, py - 170, hexrgb("#f2c230"), 18)
    D.poly(ctx, [(px - 4, py - 4), (px + 10, py - 30), (px + 22, py - 18)], hexrgb("#f6dcb0"), D.INK, 2, wob=0)
    ctx.restore()
    fx.glow(ctx, W / 2, H / 2, 700, "#ffd8a0", 0.12)


def shot_memory(ctx, t, S):
    """Воспоминание (тёплое): кухня в Майами, Макс протягивает свою рацию."""
    cam = Cam(Keys((0, 760), (4, 820)), 560, Keys((0, 1.05), (4, 1.15)))
    with layer(ctx, cam, t):
        bg(ctx, "miami_kitchen", (-500, -300, 3400, 1700), IN.miami_kitchen)
        p = R.stand("side", t, 7)
        k = smooth(clamp(t / 0.8))
        p.update(face="laugh", h1=(0.6 + 0.3 * k, -2.0), hturn=0.7)
        J = MAX.draw(ctx, 560, IN.FL + 20, 130, 1, p)
        hx, hy = MAX.world(560, IN.FL + 20, 130, 1, J["hand1"])
        IN.walkie(ctx, hx + 10, hy - 30, 0.9)
        pl = R.stand("side", t, 1)
        pl.update(face="smile", h1=(0.7, -2.2) if t > 1.2 else (0.3, -1.6), hturn=0.7)
        LEO.draw(ctx, 950, IN.FL + 20, 130, -1, pl)
        pm = R.stand("side", t, 6)
        pm.update(face="smile", h1=(0.4, -2.5))
        MOM.draw(ctx, 1400, IN.FL + 20, 130, -1, pm)
    fx.grade(ctx, "memory", 0.6)
    fx.flash(ctx, 0.12, "#fff2d8")
    if t > 0.5:
        x, y = cam.to_screen(t, 560, 330)
        D.rrect(ctx, x - 330, y - 170, 700, 140, 50, hexrgb("#ffffff"), D.INK, 5)
        D.poly(ctx, [(x - 20, y - 32), (x + 30, y - 32), (x - 40, y + 20)], hexrgb("#ffffff"), D.INK, 5, wob=0)
        D.text(ctx, "in case the ship sinks!", x + 20, y - 80, 66, D.FONT_HAND, D.INK)
    # рамка-виньетка воспоминания
    D.col(ctx, hexrgb("#ffffff"), 0.35)
    ctx.set_line_width(80)
    ctx.rectangle(0, 0, W, H)
    ctx.stroke()


def shot_range(ctx, t, S):
    """Рация в руке: «RANGE: 2 MILES»; карта: кружок в две мили вокруг корабля и 400 миль до Майами."""
    if t < 1.6:
        D.vgrad(ctx, 0, 0, W, H, [(0, "#1a2650"), (1, "#0e1430")])
        IN.walkie(ctx, W / 2, H / 2 + 80, 3.2, 0.05)
        ctx.save()
        ctx.translate(W / 2 + 230, H / 2 + 40)
        ctx.rotate(0.08)
        D.rrect(ctx, -10, -50, 470, 100, 16, hexrgb("#fff6d8"), D.INK, 5)
        D.text(ctx, "RANGE: 2 MI", 225, 20, 54, D.FONT_TITLE, D.INK)
        ctx.restore()
    else:
        tt = t - 1.6
        caribbean_map(ctx, t, stamps=0.0, ship=(1500, 260))
        mx, my = 760, 330
        k = clamp(tt / 0.8)
        D.line(ctx, 1500, 260, lerp(1500, mx, k), lerp(260, my, k), hexrgb("#e8423c"), 8)
        D.circle(ctx, 1500, 260, 26, None, hexrgb("#ffe36a"), 6)
        if k >= 1:
            D.rrect(ctx, 990, 200, 290, 90, 20, hexrgb("#fff6d8"), D.INK, 5)
            D.text(ctx, "400 MI", 1135, 265, 60, D.FONT_TITLE, hexrgb("#e8423c"))
            D.text(ctx, "2 MI →", 1560, 200, 34, D.FONT_TITLE, hexrgb("#ffe36a"), stroke=D.INK, slw=5)


def shot_cry(ctx, t, S):
    cam = Cam(Keys((0, 1150), (5, 1110)), Keys((0, 200), (5, 230)), Keys((0, 1.55), (5, 1.75)))
    sea_back(ctx, t, cam, "night", moon=(1500, -200, 45), hy=900, p=0.2)
    with layer(ctx, cam, t):
        bg(ctx, "wing_night_lit0", (-700, -600, 2900, 3000), lambda c: OD.wing(c, "night", 0.0))
        T_BUMP = 2.6
        p = floor_sit_pose(t, 1, "cry" if t < T_BUMP + 0.6 else "sad")
        p.update(tears=1.0, tears_t=t, h1=(0.62, -0.95), h2=(0.55, -0.9), hturn=0.7)
        if t > T_BUMP:
            p.update(htilt=-0.15, face="smile", tears=1.0)
        J = LEO_CAP.draw(ctx, 1050, OD.WING_Y, 110, 1, p)
        hx, hy = LEO_CAP.world(1050, OD.WING_Y, 110, 1, J["hand1"])
        IN.bottle(ctx, hx + 20, hy - 10, 0.75, -1.1)
        k = clamp((t - (T_BUMP - 0.6)) / 0.6)
        cx = lerp(1350, 1200, ease_out(k))
        bump = math.sin(clamp((t - T_BUMP) / 0.4) * math.pi) * 20 if t > T_BUMP else 0
        draw_cat(ctx, cx - bump, OD.WING_Y, 100, -1, cat_pose(t, "stand", look=-0.6 if t > T_BUMP else 0.0))
        if t > T_BUMP + 0.2:
            for i in range(3):
                ph = (t * 0.8 + i / 3) % 1
                D.text(ctx, "♥", cx - 60 + i * 30, OD.WING_Y - 160 - ph * 80, 40, D.FONT_HAND, hexrgb("#f05a8a"),
                       alpha=1 - ph)
    fx.darkness(ctx, 0.3, [fx.Light(*cam.to_screen(t, 1100, 200), 700, power=0.6, glow="#cfe0ff", glow_a=0.1)])


def shot_bang(ctx, t, S):
    T_HIT = 0.6
    cam = Cam(Keys((0, 450), (T_HIT, BR.DOOR_X + 40)), Keys((0, 560), (T_HIT, 430)),
              Keys((0, 1.2), (T_HIT, 2.6, "in")), shake=lambda tt: shake_k(tt, T_HIT, 0.7, 2.0))
    night_bridge(ctx, t, cam, door_glass=True)
    with layer(ctx, cam, t):
        # лицо за стеклом
        if t > T_HIT - 0.1:
            ctx.save()
            ctx.rectangle(BR.DOOR_X - 50, 360, 100, 120)
            ctx.clip()
            k = clamp((t - (T_HIT - 0.1)) / 0.1)
            slide = clamp((t - T_HIT - 1.4) / 1.5) * 60
            R.Fig(R.zombie_look(2200, "officer")).head_only(ctx, BR.DOOR_X, 420 + slide, 150 * (0.7 + 0.3 * k), 1,
                                                              {"view": "front", "mouth": 1.0, "neck_line": False})
            ctx.restore()
            # трещины
            r = rng(4)
            for i in range(7):
                a = r.uniform(0, TAU)
                L = r.uniform(30, 60)
                D.line(ctx, BR.DOOR_X + 10, 410, BR.DOOR_X + 10 + math.cos(a) * L, 410 + math.sin(a) * L,
                       hexrgb("#ffffff"), 3, 0.9)
        p = R.stand("side", t, 1)
        p.update(face="scream" if t > T_HIT else "sad", blink=0, lean=-0.2 if t > T_HIT else 0.0, hturn=-0.8)
        LEO_CAP.draw(ctx, 620, BR.BF + 40, 120, -1, p)
        draw_cat(ctx, 450, BR.BF + 40, 95, -1, cat_pose(t, "hiss" if t > T_HIT + 0.1 else "stand"))
    if t > T_HIT:
        impact(ctx, W / 2, H / 2 - 40, clamp((t - T_HIT) / 0.35), 260, "#ffffff")
        pop_text(ctx, "BANG!", W / 2 - 420, 250, t, T_HIT, 170, "#fff6d8")
    if t > T_HIT + 1.5:
        pop_text(ctx, "THE GLASS HOLDS.", W / 2, 920, t, T_HIT + 1.5, 70, "#4cff8a", dur=3.0, shake=False)


def build(S):
    c = S.cue
    S.shots = [
        Shot(0, shot_letter),
        Shot(c(1) - 0.1, shot_memory, "white", 0.4),
        Shot(c(2) - 0.1, shot_range, "fade", 0.3),
        Shot(c(3) - 0.1, shot_cry, "fade", 0.4),
        Shot(c(4) - 0.4, shot_bang),
    ]
    S.sfx += [(0.2, "pencil", 0.6), (c(3) + 2.4, "purr", 0.8), (c(4) + 0.2, "bang_glass", 1.0),
              (c(4) + 0.3, "hiss_cat", 0.8)]
    S.music = "sad"
