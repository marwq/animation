"""День 30: рассвет, белый корабль на горизонте. Рация Макса трещит — две мили: «Си Эмпресс, это
катер «Вэлиант». Есть кто живой?» — «Один уборщик посуды. Одна кошка». Цепь — гудок — пять тысяч
голов к носу. Тарзанка над Бордвоком, бегом на корму, гидроцикл, Анкор в жилете. Сорок одна секунда."""
from scenes.kit import *
from scenes.shared import *
from scenes.d29 import funnel_bg, CHAIN
from scenes.d08 import zip_point, bw_zombies
from scenes.d11 import ride, spray

TOD = "dawn"
SUN0 = (500, 330, 80)
HY = 360


def starts(S):
    """Начала планов (общие для build и секундомера)."""
    c = S.cue
    l3 = c(4) - c(3)
    l4 = c(5) - c(4)
    return dict(dawn=0.0, walkie=c(1) - 0.1, reply=c(2) - 0.1, pull=c(3) - 0.1, turn=c(3) + l3 * 0.45,
                zip=c(4) - 0.1, run=c(4) + l4 * 0.36, ski=c(4) + l4 * 0.64, end=c(5) - 0.1,
                horn=c(3) + l3 * 0.25)


def stopwatch(ctx, S, T, big=False):
    st = starts(S)
    t1 = S.cue(5) + 0.6
    sec = 41 * clamp((T - st["horn"]) / (t1 - st["horn"]))
    done = sec >= 41
    if big:
        return sec
    D.rrect(ctx, W - 430, 110, 330, 140, 28, hexrgb("#0e1410"), D.INK, 6)
    D.text(ctx, "0:%02d" % int(sec), W - 265, 215, 100, D.FONT_TITLE, hexrgb("#4cff8a" if done else "#ffe36a"))
    return sec


def shot_dawn(ctx, t, S):
    d = S.cue(1) - 0.1
    T_UP, T_SEE = 0.7, d * 0.55
    sun = (SUN0[0], SUN0[1] - 25 * t, SUN0[2])
    cam = Cam(Keys((0, 1100), (T_SEE, 1300, "io"), (d, 1450)), Keys((0, 420), (d, 440)),
              Keys((0, 1.35), (T_SEE, 1.25), (d, 1.15)))
    funnel_bg(ctx, t, cam, TOD, sun=sun, hy=HY)
    CX = 1680
    with layer(ctx, cam, t, 0.2):
        SEA.cutter(ctx, CX + 260 * (1 - smooth(clamp(t / T_SEE))), HY + 3, 0.2, -1)
    with layer(ctx, cam, t):
        OD.horn(ctx, 1300, OD.FTOP - 20, 1.0, TOD)
        if t < T_UP:
            p = sit_pose(t, 1, "sleep", seat=0.0)
            p.update(f1=(0.8, 0.0), f2=(0.7, 0.0), h1=(1.05, -0.62), blink=1.0)
            LEO_CAP.draw(ctx, 1480, OD.FTOP - 20, 105, -1, p)
        else:
            p = R.stand("side", t, 1)
            see = t > T_SEE
            p.update(face="shock" if see else "neutral", h1=(0.45, -3.2), hturn=0.7, blink=0 if see else p["blink"])
            LEO_CAP.draw(ctx, 1520, OD.FTOP - 20, 105, 1, p)
        draw_cat(ctx, 1680, OD.FTOP - 20, 70, 1, cat_pose(t, "sleep" if t < T_UP else "sit", look=-0.2))
    fx.glow(ctx, *cam.to_screen(t, sun[0], sun[1], 0.2), 900, "#ffc890", 0.35)
    if t > T_SEE:
        x, y = cam.to_screen(t, CX, HY - 10, 0.2)
        pop_text(ctx, "!", 1500, 300, t, T_SEE, 200, "#e8423c", dur=1.0)
        D.circle(ctx, x, y - 10, 70 * ease_out_back(clamp((t - T_SEE) / 0.3)), None, hexrgb("#ffe36a"), 6)


def shot_walkie(ctx, t, S):
    d = S.cue(2) - S.cue(1)
    T_SHIP = d * 0.38
    if t < T_SHIP:
        D.vgrad(ctx, 0, 0, W, H, [(0, "#f6a88a"), (1, "#7a5aa8")])
        IN.walkie(ctx, 620, 620, 3.2 + 0.05 * math.sin(t * 30), -0.08, on=1.0, t=t)
        pop_text(ctx, "KSSHH", 980, 260, t, 0.1, 110, "#fff6d8", dur=1.0)
        ctx.save()
        ctx.translate(1450, 620)
        k = ease_out_back(clamp((t - 0.6) / 0.4))
        D.circle(ctx, 0, 0, 230 * k, hexrgb("#4cff8a"), hexrgb("#1a6a3a"), 6, alpha=0.25)
        D.circle(ctx, 0, 0, 230 * k, None, hexrgb("#4cff8a"), 6)
        D.circle(ctx, 0, 0, 12, hexrgb("#ffffff"), D.INK, 3)
        D.circle(ctx, 150, -90, 12, hexrgb("#e8423c"), D.INK, 3)
        D.text(ctx, "2 MI", 0, 300, 50, D.FONT_TITLE, hexrgb("#4cff8a"), stroke=D.INK, slw=6)
        if t > 1.2:
            D.text(ctx, "IN RANGE!", 0, -280, 64, D.FONT_TITLE, hexrgb("#ffe36a"), stroke=D.INK, slw=6,
                   alpha=clamp((t - 1.2) / 0.2))
        ctx.restore()
        return
    tt = t - T_SHIP
    cam = Cam(Keys((0, 900), (d, 980)), 520, Keys((0, 1.1), (d, 1.25)))
    sea_back(ctx, tt, cam, TOD, sun=(300, 560, 80), hy=640, p=0.3)
    with layer(ctx, cam, tt):
        SEA.cutter(ctx, 1000, 720, 1.3, -1)
        for k in range(20):
            u = k / 20
            D.ellipse(ctx, 1000 + 400 + u * 600, 726, 40 + 100 * u, 6 + 8 * u, (1, 1, 1), None, 0, alpha=0.5 * (1 - u))
        OD.flag(ctx, 1080, 370, tt, "#e8423c", 80, 46)
        for k in range(3):
            r = 60 + k * 70 + (tt * 120) % 70
            ctx.arc(930, 400, r, -math.pi * 0.95, -math.pi * 0.55)
            D.col(ctx, (1, 1, 1), 0.8 * (1 - k / 3))
            ctx.set_line_width(6)
            ctx.stroke()
    txt = "SEA EMPRESS, THIS IS THE CUTTER VALIANT. ANYBODY ABOARD?"
    n = int(clamp(tt / (d - T_SHIP - 0.6)) * len(txt))
    D.rrect(ctx, 160, 130, 1600, 200, 30, hexrgb("#fff6d8"), D.INK, 6)
    D.poly(ctx, [(820, 328), (900, 328), (760, 420)], hexrgb("#fff6d8"), D.INK, 6, wob=0)
    D.rect(ctx, 790, 318, 120, 14, hexrgb("#fff6d8"), None, 0, wob=0)
    words = txt[:n]
    l1, l2 = words[:40], words[41:]
    D.text(ctx, l1, 960, 215, 56, D.FONT_TITLE, hexrgb("#1c3f7c"))
    D.text(ctx, l2, 960, 290, 56, D.FONT_TITLE, hexrgb("#e8423c"))


def shot_reply(ctx, t, S):
    d = S.cue(3) - S.cue(2)
    cam = Cam(Keys((0, 1880), (d, 1900)), Keys((0, 330), (d, 320)), Keys((0, 2.0), (d, 2.3)))
    funnel_bg(ctx, t, cam, TOD, sun=SUN0, hy=HY)
    with layer(ctx, cam, t):
        p = R.stand("side", t, 1)
        talk = 0.3 + 0.5 * abs(math.sin(t * 10)) if t < d * 0.7 else 0.0
        p.update(face="determined", mouth=talk, h1=(0.42, -3.1), h2=(0.5, -2.2), hturn=0.5)
        x = 1680
        J = LEO_VEST.draw(ctx, x, OD.FTOP - 20, 105, 1, p)
        hx, hy = LEO_VEST.world(x, OD.FTOP - 20, 105, 1, J["hand1"])
        IN.walkie(ctx, hx + 10, hy, 0.6, 0.3, on=1.0, t=t)
        cx, cy = LEO_VEST.world(x, OD.FTOP - 20, 105, 1, J["top"])
        meow = 1.0 if d * 0.5 < t < d * 0.75 else 0.0
        draw_cat(ctx, cx + 22, cy + 70, 46, 1, cat_pose(t, "held", meow=meow))
    pop_text(ctx, "ONE BUSBOY.", 1360, 300, t, 0.1, 110, "#fff6d8", dur=d, shake=False)
    pop_text(ctx, "ONE CAT.", 1400, 470, t, d * 0.45, 120, "#f2782e", dur=d, shake=False)
    if t > d * 0.5:
        pop_text(ctx, "MEOW", 900, 640, t, d * 0.5, 70, "#f2782e", dur=0.8)


def shot_pull(ctx, t, S):
    st = starts(S)
    th = st["horn"] - st["pull"]
    blast = clamp((t - th) / 0.15)
    cam = Cam(Keys((0, 1280), (th, 1250)), Keys((0, 400), (th, 360)), Keys((0, 1.8), (th, 2.1, "in")),
              shake=lambda tt: shake_k(tt, th, 1.5, 2.6))
    funnel_bg(ctx, t, cam, TOD, sun=SUN0, hy=HY)
    with layer(ctx, cam, t):
        pull = smooth(clamp((t - th + 0.35) / 0.35))
        cp = 0.35 * pull
        OD.horn(ctx, 1300, OD.FTOP - 20, 1.0, TOD, chain_pull=cp, blast=blast * (0.6 + 0.4 * math.sin(t * 30)))
        hy_ = (-240 + 190 * (1 + 0.4 * cp) - 5) / 105
        p = sit_pose(t, 1, "scream" if blast > 0 else "determined", seat=0.0)
        p.update(f1=(0.8, 0.0), f2=(0.7, 0.0), h1=((1480 - 1370) / 105, hy_), h2=((1480 - 1375) / 105, hy_ + 0.05),
                 lean=-0.3 * pull, hturn=0.6)
        LEO_VEST.draw(ctx, 1480, OD.FTOP - 20, 105, -1, p)
        if blast > 0:
            for k in range(6):
                r = ((t - th) * 900 + k * 260) % 1600
                ctx.arc(1000, OD.FTOP - 340, r, math.pi * 0.6, math.pi * 1.4)
                D.col(ctx, (1, 1, 1), 0.6 * (1 - r / 1600))
                ctx.set_line_width(16)
                ctx.stroke()
    if blast > 0:
        txt = "HOOOOOONK!"
        D.text(ctx, txt, W / 2 - 240 + math.sin(t * 60) * 10, 300 + math.cos(t * 50) * 8, 160, D.FONT_TITLE,
               hexrgb("#ffe36a"), stroke=D.INK, slw=14, rot=-0.06)
        stopwatch(ctx, S, st["pull"] + t)


def shot_turn(ctx, t, S):
    st = starts(S)
    d = st["zip"] - st["turn"]
    T_RUN = d * 0.35
    cam = Cam(Keys((0, 1700), (d, 2500)), 640, Keys((0, 0.55), (d, 0.62)), shake=0.25)
    deck_back(ctx, t, cam, TOD, 0.0, sun=(2600, 300, 70), mess=0.6)
    with layer(ctx, cam, t):
        r = rng(30)
        for i in range(70):
            y = r.uniform(880, 1180)
            x0 = r.uniform(-900, 4000)
            look = R.zombie_look(5000 + i)
            s = deck_s(y)
            if t < T_RUN:
                p = zombie_idle(t, i)
                turned = t > T_RUN * (0.2 + 0.6 * r.random())
                p["hturn"] = 1.0 if turned else -1.0
                R.Fig(look).draw(ctx, x0, y, s, 1 if turned else -1, p)
            else:
                tt = t - T_RUN
                v = r.uniform(600, 800)
                x = x0 + v * tt * (0.5 + 0.5 * clamp(tt / 0.5))
                p = R.gait(v * tt / s / R.GAITS["run"]["L"] + i * 0.3, "run", "side", i)
                p.update(a1=(1.4, -0.1), a2=(1.2, 0.0), mouth=0.9, lean=0.35)
                R.Fig(look).draw(ctx, x, y, s, 1, p)
    if t > T_RUN:
        motion_lines(ctx, 600, 700, 1, 6, 300, 50, a=0.6)
    for i in range(10):
        t0 = 0.1 + i * 0.07
        if t > t0:
            D.text(ctx, "!", 160 + i * 170, 380 + (i % 3) * 50, 90, D.FONT_TITLE, hexrgb("#e8423c"),
                   alpha=clamp(1.5 - (t - t0)), stroke=D.INK, slw=8)
    pop_text(ctx, "5,000 HEADS", W / 2, 230, t, 0.2, 90, "#9fc86a", dur=d, shake=False)
    stopwatch(ctx, S, st["turn"] + t)


def vest_cat(ctx, fig, x, gy, s, f, J, t):
    """Анкор выглядывает из спасжилета."""
    cx, cy = fig.world(x, gy, s, f, J["top"])
    draw_cat(ctx, cx + f * 0.15 * s, cy + 0.55 * s, s * 0.42, f, cat_pose(t, "held", vest=False))


def shot_zip(ctx, t, S):
    st = starts(S)
    d = st["run"] - st["zip"]
    uu = lambda tt: 0.05 + 0.9 * ease_in(clamp(tt / (d + 0.2)))
    s = 105
    cam = Cam(lambda tt: zip_point(uu(tt))[0] + 150, lambda tt: zip_point(uu(tt))[1] + 300, 0.95, shake=0.3)
    with layer(ctx, cam, t):
        bg(ctx, "bw_dawn", (-1700, -1500, 6800, 2600), lambda c: IN.boardwalk(c, "dawn", 0.0))
        IN.carousel(ctx, t, tod="dawn", power=0.0, spin=0.0)
        bw_zombies(ctx, t, n=5, look_up=1.0)
        x, y = zip_point(uu(t))
        p = hang_pose(t, swing=-0.5, face="determined")
        p.update(mouth=0.6)
        J = LEO_VEST.draw(ctx, x - 10, y + 3.75 * s - 10, s, 1, p)
        vest_cat(ctx, LEO_VEST, x - 10, y + 3.75 * s - 10, s, 1, J, t)
        D.rrect(ctx, x - 30, y - 22, 60, 30, 8, hexrgb("#3a4048"), D.INK, 3)
    speed_lines(ctx, t, n=50, a=0.55)
    pop_text(ctx, "ZIP!", 480, 300, t, 0.2, 150, "#f2c230", dur=1.5)
    stopwatch(ctx, S, st["zip"] + t)


def shot_run(ctx, t, S):
    st = starts(S)
    d = st["ski"] - st["run"]
    cam = Cam(Keys((0, 1100), (d, 100)), 760, 0.85, shake=0.15)
    deck_back(ctx, t, cam, TOD, 0.0, sun=(2600, 300, 70), mess=0.6)
    with layer(ctx, cam, t):
        r = rng(31)
        for i in range(12):
            x = r.uniform(-200, 2600) + t * 650
            y = r.uniform(880, 940)
            p = R.gait(t * 650 / 70 / R.GAITS["run"]["L"] + i, "run", "side", i)
            p.update(a1=(1.4, -0.1), a2=(1.2, 0.0), mouth=0.9, lean=0.35)
            R.Fig(R.zombie_look(5200 + i)).draw(ctx, x, y, 70, 1, p)
        w = Walk(Keys((0, 1350), (d + 0.2, -300, "lin")), 1090, 120, "run", t1=d + 1)
        J = w.draw(ctx, LEO_VEST, t, {"face": "determined"})
        if J is not None:
            vest_cat(ctx, LEO_VEST, w.x(t), 1090, 120, -1, J, t)
    motion_lines(ctx, 900, 760, -1, 6, 300, 40, a=0.5)
    pop_text(ctx, "STERN!", 520, 300, t, 0.1, 110, "#fff6d8", dur=d, shake=False)
    stopwatch(ctx, S, st["run"] + t)


def shot_ski(ctx, t, S):
    st = starts(S)
    d = st["end"] - st["ski"]
    T_JUMP = d * 0.45
    x0, x1 = IN.MARINA_DOOR
    cam = Cam(Keys((0, 1200), (d, 1900)), 560, Keys((0, 0.9), (d, 1.0)), shake=0.2)
    with layer(ctx, cam, t):
        D.rect(ctx, -700, 1000, 4200, 700, hexrgb("#aeb6bc"), None, 0, wob=0)
        bg(ctx, "marina_dawn", (-700, -300, 4200, 1600), lambda c: IN.marina(c, TOD))
        IN.marina_opening(ctx, t, TOD, (2500, 520, 60))
        if t < T_JUMP:
            x = Keys((0, 700), (T_JUMP, 1900, "in"))(t)
            ride(ctx, t, x, IN.FL - 70, 105, 1, "determined", fig=LEO_VEST)
            spray(ctx, x - 120, IN.FL - 70, t)
        else:
            # прыжок с пандуса в проём — и в открытое море, вдаль
            k = clamp((t - T_JUMP) / (d - T_JUMP))
            x = lerp(1900, 2350, ease_out(k))
            wl = lerp(IN.FL - 70, 640, ease_out(k)) - math.sin(math.pi * clamp(k * 2.2)) * 160
            sc = lerp(105, 38, ease_out(k))
            ctx.save()
            if k > 0.3:
                ctx.rectangle(x0, 120, x1 - x0, IN.FL - 120)
                ctx.clip()
            ride(ctx, t, x, wl, sc, 1, "laugh", tilt=-0.2 * math.sin(math.pi * clamp(k * 2.2)), fig=LEO_VEST)
            if k > 0.45:
                SEA.splash(ctx, lerp(1900, 2350, ease_out(0.45)) + 40, lerp(IN.FL - 70, 640, ease_out(0.45)),
                           clamp((k - 0.45) / 0.3), 1.2, seed=3)
                spray(ctx, x - sc * 1.2, wl, t)
            ctx.restore()
    if t > T_JUMP:
        pop_text(ctx, "WOOO!", 700, 300, t, T_JUMP, 140, "#7fd0ff", dur=1.6)
    stopwatch(ctx, S, st["ski"] + t)


def shot_end(ctx, t, S):
    st = starts(S)
    d = S.dur - st["end"]
    cam = Cam(Keys((0, 300), (d, 450)), 520, Keys((0, 0.75), (d, 0.85)))
    sea_back(ctx, t, cam, TOD, sun=(-300, 560, 80), hy=640, p=0.3)
    ship_ext(ctx, t, cam, -900, 760, 0.6, TOD, 0.0, wake=0.0, smoke=False, antenna=False)
    with layer(ctx, cam, t):
        # толпа на носу — точки у перил
        for i in range(40):
            bx = -900 + 0.6 * (900 + (i % 10) * 30)
            by = 760 - 0.6 * (560 + (i // 10) * 12)
            D.circle(ctx, bx + math.sin(t * 5 + i) * 3, by, 7, hexrgb(R.ZOMBIE_SKIN[i % len(R.ZOMBIE_SKIN)]), D.INK, 2)
        SEA.cutter(ctx, 1450, 720, 1.0, -1)
        jx = Keys((0, 200), (d, 1000, "out"))(t)
        for k in range(16):
            u = k / 16
            D.ellipse(ctx, jx - 120 - u * 700, 728, 30 + 90 * u, 5 + 6 * u, (1, 1, 1), None, 0, alpha=0.6 * (1 - u))
        ride(ctx, t, jx, 720, 80, 1, "laugh", tilt=math.sin(t * 6) * 0.04, fig=LEO_VEST)
        spray(ctx, jx - 90, 720, t)
    sec = stopwatch(ctx, S, st["end"] + t, big=True)
    k = ease_out_back(clamp((t - 0.5) / 0.4))
    if k > 0:
        ctx.save()
        ctx.translate(W / 2, 330)
        ctx.scale(k, k)
        D.rrect(ctx, -330, -140, 660, 240, 40, hexrgb("#0e1410"), D.INK, 8)
        done = sec >= 41
        D.text(ctx, "0:%02d" % int(sec), 0, 70, 200, D.FONT_TITLE, hexrgb("#4cff8a" if done else "#ffe36a"))
        ctx.restore()
    if sec >= 41:
        pop_text(ctx, "41 SECONDS.", W / 2, 560, t, t - (t - 1.0 if t > 1.0 else 0), 120, "#fff6d8", dur=99,
                 shake=False)
        r = rng(41)
        for i in range(40):
            ph = (t * 0.6 + r.random()) % 1
            D.rect(ctx, r.uniform(0, W), ph * H, 14, 24, hexrgb(r.choice(["#e8423c", "#f2c230", "#2f8fd8", "#4cff8a"])),
                   None, 0, wob=0)


def build(S):
    st = starts(S)
    S.shots = [
        Shot(st["dawn"], shot_dawn),
        Shot(st["walkie"], shot_walkie, "fade", 0.25),
        Shot(st["reply"], shot_reply),
        Shot(st["pull"], shot_pull, "fade", 0.2),
        Shot(st["turn"], shot_turn),
        Shot(st["zip"], shot_zip, "whip", 0.25),
        Shot(st["run"], shot_run, "whip", 0.25),
        Shot(st["ski"], shot_ski, "whip", 0.25),
        Shot(st["end"], shot_end, "white", 0.3),
    ]
    S.tods = [(0, "day")]
    S.sfx += [(S.cue(1), "static", 0.8), (S.cue(2) + 0.6, "meow", 0.9), (st["horn"], "horn", 1.0),
              (st["turn"] + 0.3, "zombie_groan", 1.0), (st["zip"], "zip", 1.0), (st["ski"] + 0.2, "engine", 0.9),
              (st["end"] + 1.0, "ding", 1.0)]
    S.music = "finale"
