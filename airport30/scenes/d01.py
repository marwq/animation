"""День 1: аэропорт «Лейкшор» с высоты. Дэнни, 18, кидает чемоданы. Рейс 902 садится раньше, первый
пассажир кусает пограничника. Через десять минут терминал C кричит. Нырок на багажную ленту,
сквозь стену, вниз в темноту. Наверху запираются двери."""
from scenes.kit import *
from scenes.shared import *


def shot_aerial(ctx, t, S):
    d = S.cue(1) - 0.1
    D.rect(ctx, 0, 0, W, H, tone("#86c46a", "day"), None, 0, wob=0)
    s = Keys((0, 0.24), (d, 0.34, "io"))(t)
    cx = Keys((0, W / 2 + 120), (d, W / 2 - 60))(t)
    map_view(ctx, t, cx, H / 2 + 60, s, "day", labels=False, squash=0.75)
    # самолёты рулят и садятся (в координатах карты)
    ctx.save()
    ctx.translate(cx, H / 2 + 60)
    ctx.scale(s, s * 0.75)
    for i in range(4):
        u = ((t * 0.06 + i * 0.25) % 1.0)
        PL.jet_top(ctx, lerp(-2600, 3000, u), 760, 0.9, 0.0)
    PL.jet_top(ctx, lerp(3300, -1000, smooth(clamp(t / d))), 1150, 1.0, math.pi)
    for k, (gx, gy) in enumerate(((-1700, 520), (-150, 520), (1400, 520), (-1300, 300))):
        PL.jet_top(ctx, gx + 260, gy, 0.8, math.pi / 2)
    ctx.restore()
    SEA.cloudbank(ctx, -200, W + 200, 120, "day", seed=2, n=6, s0=0.9, s1=1.3, alpha=0.85)
    k = ease_out_back(clamp((t - 0.6) / 0.4))
    if k > 0:
        ctx.save()
        ctx.translate(W / 2, 200)
        ctx.scale(k, k)
        D.rrect(ctx, -580, -80, 1160, 160, 30, hexrgb("#fff6d8"), D.INK, 6)
        logo(ctx, -490, 0, 50)
        D.text(ctx, "LAKESHORE INTERNATIONAL", 50, 26, 64, D.FONT_TITLE, hexrgb("#1c3f7c"))
        ctx.restore()


def shot_throw(ctx, t, S):
    d = S.cue(2) - S.cue(1)
    cam = Cam(Keys((0, 1550), (d, 1650)), 720, Keys((0, 1.05), (d, 1.2)))
    apron_back(ctx, t, cam, "day", sun=(2600, -100, 80), x0=-200, x1=3600, scale=0.8)
    with layer(ctx, cam, t):
        PL.jet(ctx, 2300, AP.GY + 40, 0.75, -1, "day")
        # ленточный погрузчик к багажному люку
        D.poly(ctx, [(1200, AP.GY + 30), (1780, AP.GY - 230), (1820, AP.GY - 200), (1240, AP.GY + 60)],
               tone("#9aa3ac", "day"), D.INK, 5, wob=0)
        for wx in (1280, 1600):
            D.circle(ctx, wx, AP.GY + 70, 26, tone("#2b2f3a", "day"), D.INK, 4)
        D.rect(ctx, 1150, AP.GY + 20, 520, 50, tone("#f2c230", "day"), D.INK, 4, wob=0)
        # бросок: чемодан летит по дуге от тележки на ленту
        ph = (t * 0.9) % 1.0
        p = R.stand("side", t, 1)
        swing = math.sin(ph * TAU)
        p.update(face="happy", h1=(0.6 + 0.4 * swing, -2.2 - 0.9 * max(0, swing)),
                 h2=(0.5 + 0.4 * swing, -2.0 - 0.9 * max(0, swing)), lean=0.15 * swing)
        DANNY.draw(ctx, 980, AP.GY + 70, 110, 1, p)
        PL.tug(ctx, 520, AP.GY + 90, 0.55, 1, "day", carts=1, beacon=0.0, seed=3)
        bx = lerp(1060, 1360, ph)
        by = AP.GY - 160 - math.sin(math.pi * ph) * 220
        suitcase(ctx, bx, by, 0.5, ["#e8423c", "#2f8fd8", "#3fbf6a", "#f2c230"][int(t * 0.9) % 4], ph * 4,
                 handle=False)
        for k in range(3):
            u = (ph + k / 3) % 1
            suitcase(ctx, lerp(1300, 1760, u), lerp(AP.GY + 10, AP.GY - 210, u), 0.45,
                     ["#7a4fc2", "#e8423c", "#f2c230"][k], -0.42, handle=False)
    pop_text(ctx, "18", W - 420, 300, t, 0.2, 200, "#ffe36a", dur=d, shake=False)
    pop_text(ctx, "BAGGAGE HANDLER", W - 420, 420, t, 0.5, 56, "#fff6d8", dur=d, shake=False)


def shot_land(ctx, t, S):
    """Рейс 902 касается полосы (дым из-под колёс), затем паспортный контроль и укус."""
    d = S.cue(3) - S.cue(2)
    T_BITE = d * 0.72
    if t < d * 0.4:
        cam = Cam(Keys((0, 600), (d * 0.4, 1400)), 560, 0.62)
        apron_back(ctx, t, cam, "day", sun=(2600, -100, 80), x0=-1600, x1=4600)
        with layer(ctx, cam, t):
            x = lerp(-300, 1700, t / (d * 0.4))
            touch = clamp((t - 0.5) / 0.3)
            y = AP.HZ + 70 - 120 * (1 - touch)
            PL.jet(ctx, x, y, 0.55, 1, "day", shadow=touch > 0.5)
            if touch > 0:
                for k in range(5):
                    ph = (t * 2 + k / 5) % 1
                    D.circle(ctx, x - 140 - ph * 300, y - 8 - ph * 30, 14 + 30 * ph, hexrgb("#f4f4f0"), None, 0,
                             alpha=0.6 * (1 - ph))
        D.rrect(ctx, 80, 110, 640, 140, 24, hexrgb("#15181f"), D.INK, 6)
        D.text(ctx, "902  LONDON", 110, 175, 50, D.FONT_TITLE, hexrgb("#ffd23a"), "left")
        D.text(ctx, "EARLY", 690, 230, 44, D.FONT_TITLE, hexrgb("#4cff8a"), "right")
        return
    tt = t - d * 0.4
    cam = Cam(Keys((0, 1080), (T_BITE - d * 0.4, 1110)), 560, Keys((0, 1.25), (T_BITE - d * 0.4 + 0.2, 1.7, "out")),
              shake=lambda q: shake_k(q, T_BITE - d * 0.4, 0.5, 1.4))
    room_back(ctx, tt, cam, "passport", lambda c: TM.passport(c), (-600, -1500, 4800, 3300))
    with layer(ctx, cam, tt):
        bx = 300 + 800
        officer = R.Fig(living_look(51, "tsa"))
        po = R.stand("side", tt, 2)
        bit = t > T_BITE
        po.update(face="scream" if bit else "smile", hturn=-0.8, blink=0 if bit else po["blink"],
                  h1=(-0.5, -2.6) if not bit else (-0.3, -3.3))
        officer.draw(ctx, bx + 230, TM.FL + 20, 110, -1, po)
        z = R.Fig(R.zombie_look(902, "traveler"))
        lunge = smooth(clamp((t - T_BITE + 0.2) / 0.2))
        pz = zombie_reach(tt, 3)
        pz.update(lean=0.15 + 0.45 * lunge, mouth=1.0 if lunge > 0 else 0.3, neck=0.3 * lunge)
        z.draw(ctx, bx - 120 + 120 * lunge, TM.FL, 110, 1, pz)
        if bit:
            impact(ctx, *cam.to_screen(tt, bx + 120, TM.FL - 520), clamp((t - T_BITE) / 0.3), 120, "#ffffff")
    if t > T_BITE:
        pop_text(ctx, "CHOMP!", W / 2 + 320, 260, t, T_BITE, 150, "#e8423c", dur=1.5)


def shot_chaos(ctx, t, S):
    d = S.cue(4) - S.cue(3)
    cam = Cam(Keys((0, 2600), (d, 2300)), 520, 0.62, shake=0.2)
    term_back(ctx, t, cam, "day", 1.0, "C")
    with layer(ctx, cam, t):
        r = rng(11)
        for i in range(16):
            y = TM.FL + r.uniform(20, 300)
            s = floor_s(y)
            x0 = r.uniform(-400, 4600)
            v = r.uniform(380, 520)
            x = x0 - v * t
            zombie = i % 3 == 0
            if zombie:
                p = R.gait(t * 1.6 + i, "shamble", "side", i)
                p.update(a1=(1.4, -0.1), a2=(1.25, 0.0), mouth=0.9)
                R.Fig(R.zombie_look(1100 + i)).draw(ctx, x + 320, y, s, -1, p)
            else:
                p = R.gait(v * t / s / R.GAITS["run"]["L"] + i * 0.3, "run", "side", i)
                p.update(face="scream", a1=(2.6, 0.3), a2=(2.3, 0.4), blink=0)
                R.Fig(living_look(1200 + i)).draw(ctx, x, y, s, -1, p)
    D.rrect(ctx, W - 470, 110, 380, 130, 24, hexrgb("#0e1410"), D.INK, 6)
    D.text(ctx, "+10 MIN", W - 280, 200, 80, D.FONT_TITLE, hexrgb("#ff4a3a"))
    for k in range(3):
        pop_text(ctx, "AAAH!", 400 + k * 500, 300 + (k % 2) * 80, t, 0.2 + k * 0.4, 90, "#fff6d8", dur=1.0)


def shot_dive(ctx, t, S):
    d = S.dur - S.cue(4)
    T_DIVE, T_WALL, T_DROP, T_LOCK = 1.0, 2.2, 3.4, d * 0.78
    if t < T_DROP:
        cam = Cam(Keys((0, 600), (T_DIVE, 900), (T_WALL, 1900, "in")), 520, Keys((0, 0.75), (T_DIVE, 0.85)),
                  shake=0.12)
        room_back(ctx, t, cam, "claim", lambda c: TM.baggage_claim(c, 0.0), (-800, -1500, 4400, 3300))
        with layer(ctx, cam, t):
            RM.bags(ctx, 300, 2300, TM.FL - 172, t, 1.0, seed=4, gap=260)
            RM.curtain(ctx, 2200, TM.FL - 360, 160, 190, t, push=clamp((t - T_WALL + 0.3) / 0.3))
            if t < T_DIVE:
                w = Walk(Keys((0, -200), (T_DIVE, 600, "lin")), TM.FL, 110, "run", t1=3)
                w.draw(ctx, DANNY, t, {"face": "scream"})
            else:
                k = clamp((t - T_DIVE) / 0.4)
                x = lerp(600, 760, k) + max(0, t - T_DIVE - 0.4) * 900
                y = TM.FL - 180 - math.sin(math.pi * min(1, k)) * 120
                ctx.save()
                ctx.translate(x, y)
                ctx.rotate(-1.4 * min(1, k))
                p = R.stand("side", t, 1)
                p.update(face="scream", a1=(2.9, 0.1), a2=(2.7, 0.1), blink=0)
                DANNY.draw(ctx, 0, 0, 110, 1, p)
                ctx.restore()
            # зомби отстают
            for i in range(4):
                p = R.gait(t * 1.6 + i, "shamble", "side", i)
                p.update(a1=(1.4, -0.1), a2=(1.25, 0.0), mouth=0.9)
                R.Fig(R.zombie_look(1300 + i)).draw(ctx, -600 + i * 160 + t * 170, TM.FL + 40 + (i % 2) * 40, 115, 1,
                                                    p)
        speed_lines(ctx, t, n=30, a=0.3)
        if t > T_DIVE:
            pop_text(ctx, "DIVE!", 520, 260, t, T_DIVE, 130, "#ffe36a", dur=1.2)
        return
    tt = t - T_DROP
    T_LAND = 1.6
    if tt < T_LAND:
        # вниз по трубе-горке: полосы вращаются вокруг
        D.rect(ctx, 0, 0, W, H, hexrgb("#151924"), None, 0, wob=0)
        ctx.save()
        ctx.translate(W / 2, H / 2)
        for k in range(14):
            a = tt * 4 + k * TAU / 14
            D.poly(ctx, [(math.cos(a) * 1400, math.sin(a) * 1400), (math.cos(a + 0.22) * 1400, math.sin(a + 0.22) * 1400),
                         (math.cos(a + 0.22) * 80, math.sin(a + 0.22) * 80), (math.cos(a) * 80, math.sin(a) * 80)],
                   hexrgb("#c9d0d6" if k % 2 else "#8f99a3"), None, 0, wob=0)
        D.circle(ctx, 0, 0, 90, hexrgb("#05060a"), None, 0)
        ctx.rotate(math.sin(tt * 6) * 0.4)
        p = R.stand("side", t, 1)
        p.update(face="scream", a1=(2.9, 0.1), a2=(2.7, 0.1), k1=(0.9, 0.6), k2=(0.6, 0.4), blink=0)
        DANNY.draw(ctx, 0, 300, 150, 1, p)
        ctx.restore()
        speed_lines(ctx, t, n=50, a=0.4)
        pop_text(ctx, "aaaaaa...", W / 2 + 360, 250, tt, 0.1, 90, "#fff6d8", dur=T_LAND, shake=False)
        return
    # тёмный багажный зал: падение на гору чемоданов, наверху захлопываются двери
    lt = tt - T_LAND
    cam = Cam(Keys((0, 900), (3, 980)), Keys((0, 380), (3, 300)), Keys((0, 0.9), (3, 0.8)),
              shake=lambda q: shake_k(q, 0.25, 0.4, 1.2))
    room_back(ctx, lt, cam, "baghall_off", lambda c: RM.baggage_hall(c, 0.0), (-1400, -1600, 7400, 3400), 0.7)
    with layer(ctx, cam, lt):
        r = rng(9)
        for k in range(26):
            bx = 600 + r.uniform(-260, 260)
            by = RM.FL - 20 - r.uniform(0, 160) * (1 - abs(bx - 600) / 300)
            D.rrect(ctx, bx - 50, by - 60, 100, 70, 10, hexrgb(r.choice(RM.BAG_COLS)), D.INK, 3)
        fall = clamp(lt / 0.25)
        p = floor_sit_pose(lt, 1, "shock" if lt > 0.25 else "scream")
        p.update(blink=0, a1=(2.4, 0.5), a2=(2.1, 0.5))
        DANNY.draw(ctx, 620, lerp(-200, RM.FL - 150, fall), 110, 1, p)
        # шторы-ролеты наверху у выходов ленты
        for i, dx in enumerate((-300, 1500, 2700)):
            k = clamp((t - T_LOCK - i * 0.35) / 0.2)
            D.rect(ctx, dx - 200, -120, 400, 360, hexrgb("#0b0d14"), D.INK, 5, wob=0)
            C.shutter(ctx, dx - 200, -120, 400, 360, frac=k)
            D.circle(ctx, dx + 240, -150, 22, hexrgb("#ff4a3a") if k > 0 else hexrgb("#3a2020"), D.INK, 3)
    fx.darkness(ctx, 0.45, [fx.Light(*cam.to_screen(lt, 620, RM.FL - 300), 520, power=0.6, glow_a=0.0)])
    if lt > 0.25:
        pop_text(ctx, "THUD", W / 2 - 200, 600, lt, 0.25, 110, "#fff6d8", dur=1.0)
    if t > T_LOCK:
        kk = t - T_LOCK
        for i in range(3):
            if kk > i * 0.35:
                ks = ease_out_back(clamp((kk - i * 0.35) / 0.2))
                ctx.save()
                ctx.translate(360 + i * 600, 230 + (i % 2) * 110)
                ctx.rotate(-0.12 + i * 0.1)
                ctx.scale(ks, ks)
                D.rrect(ctx, -220, -70, 440, 140, 20, hexrgb("#e8423c"), D.INK, 6)
                D.text(ctx, "LOCKED", 0, 26, 76, D.FONT_TITLE, hexrgb("#fff6d8"))
                ctx.restore()


def build(S):
    c = S.cue
    S.shots = [
        Shot(0, shot_aerial),
        Shot(c(1) - 0.1, shot_throw, "fade", 0.3),
        Shot(c(2) - 0.1, shot_land, "whip", 0.25),
        Shot(c(3) - 0.1, shot_chaos, "whip", 0.25),
        Shot(c(4) - 0.1, shot_dive),
    ]
    d4 = S.dur - c(4)
    S.sfx += [(c(2) + (c(3) - c(2)) * 0.72, "chomp", 1.0), (c(3), "scream", 1.0), (c(4) + 1.0, "whoosh", 1.0),
              (c(4) + d4 * 0.78, "door_slam", 1.0), (c(4) + d4 * 0.78 + 0.35, "door_slam", 0.9),
              (c(4) + d4 * 0.78 + 0.7, "door_slam", 0.8)]
    S.music = [(0, "party", 0.8), (c(2) + (c(3) - c(2)) * 0.72, "chase", 1.0)]
