"""День 1: облёт лайнера, вечеринка у бассейна, укус капитана, хаос, бег по трапу, пустой мостик."""
from scenes.kit import *
from scenes.shared import *

LIVE = [R.Look(seed=40 + i, **d) for i, d in enumerate(R.PASSENGERS)]


def tray(ctx, J, which="hand1", tilt=0.0, glasses=True, n=7):
    """Поднос с бокалами на ладони (локальные координаты)."""
    hx, hy = J[which]
    ctx.save()
    ctx.translate(hx, hy - 0.05)
    ctx.rotate(tilt)
    D.ellipse(ctx, 0, 0, 0.55, 0.06, hexrgb("#c9d0d4"), D.INK, 0.03)
    if glasses:
        for k in range(n):
            gx = -0.42 + k * 0.14
            D.poly(ctx, [(gx - 0.05, -0.04), (gx + 0.05, -0.04), (gx + 0.07, -0.26), (gx - 0.07, -0.26)],
                   hexrgb("#e8f8ff"), D.INK, 0.02, wob=0, alpha=0.9)
            D.rect(ctx, gx - 0.055, -0.2, 0.11, 0.08, hexrgb("#f2a03a" if k % 2 else "#f05a8a"), None, 0, wob=0,
                   alpha=0.8)
    ctx.restore()


# --- 1. облёт: лайнер сверху над бирюзовым океаном ---------------------------------------

def shot_aerial(ctx, t, S):
    d = S.cue(1) - 0.4
    z = Keys((0, 0.3), (d - 0.9, 0.62), (d, 3.2, "in"))
    ship_x = 120 * t
    cam = Cam(lambda tt: 120 * tt + Keys((0, 500), (d - 0.9, 0), (d, -470))(tt), Keys((0, 120), (d, 0)), z,
              Keys((0, -0.15), (d, 0.0)))
    with layer(ctx, cam, t):
        D.vgrad(ctx, -9000, -6000, 18000, 12000, [(0, "#1aa3c8"), (1, "#0f86b6")])
        r = rng(3)
        for i in range(260):
            x = r.uniform(-6000, 6000)
            y = r.uniform(-4000, 4000)
            w = r.uniform(30, 90)
            ph = math.sin(t * 2 + i)
            D.col(ctx, (1, 1, 1), 0.18 + 0.12 * ph)
            ctx.set_line_width(5)
            ctx.move_to(x - w, y)
            ctx.curve_to(x - w / 2, y - 12, x + w / 2, y - 12, x + w, y)
            ctx.stroke()
        # пенный след
        for k in range(40):
            u = k / 40
            D.ellipse(ctx, ship_x - 900 - u * 3800, math.sin(u * 7 + t) * 30 * u, 180 + 600 * u, 110 + 260 * u,
                      (1, 1, 1), None, 0, alpha=0.32 * (1 - u))
        r = rng(8)
        people = []
        for i in range(70):
            px, py = r.uniform(-1050, 700), r.uniform(-140, 140)
            if -920 < px < -600:
                continue
            people.append((px + math.sin(t * 3 + i) * 10, py + math.cos(t * 2.4 + i) * 8,
                           hexrgb(r.choice(["#e8423c", "#f2c230", "#2f8fd8", "#f05a8a", "#ffffff", "#16a39a"]))))
        SH.ship_top(ctx, ship_x, 0, 0.75, t, people=people)
        SEA.gulls(ctx, t, -1500, 1500, -700, -300, n=6, s=34, speed=90)
    with layer(ctx, cam, t, 1.9):
        for i, (cx, cy, sc) in enumerate(((-1600, -700, 2.4), (900, 900, 2.0), (2400, -400, 2.6), (-300, 1500, 2.2))):
            SEA.cloud(ctx, cx + t * 60, cy, sc, "day", seed=20 + i, alpha=0.9)
    if t > d - 0.5:
        fx.flash(ctx, clamp((t - (d - 0.5)) / 0.5) * 0.9, "#ffffff")


# --- 2. вечеринка: Лео с подносом идёт вдоль бассейна --------------------------------------

def leo_walk_x(t, S):
    return Keys((0, 380), (S.cue(2) + 2.4 - (S.cue(1) - 0.4), 1500, "lin"))(t)


def party_crowd(ctx, t, skip=()):
    spots = [(1480, 960, 0), (1640, 1050, 1), (1880, 930, 2), (2100, 1060, 3), (2330, 950, 4), (2520, 1040, 5),
             (2860, 990, 0), (3000, 1070, 2), (3700, 940, 4), (3900, 1050, 1), (700, 940, 3), (180, 1000, 5)]
    for i, (x, y, k) in enumerate(spots):
        if i in skip:
            continue
        R.Fig(LIVE[k]).draw(ctx, x, y, deck_s(y), 1 if i % 2 else -1, dance_pose(t, i))


def shot_party(ctx, t, S):
    wx = lambda tt: leo_walk_x(tt, S)
    w = Walk(wx, 1010, deck_s(1010), "walk", t1=12)
    cam = Cam(lambda tt: wx(tt) + 260, 640, 1.05, drift=1.0)
    with layer(ctx, cam, t):
        pass
    deck_back(ctx, t, cam, "day", 1.0, sun=(2400, 0, 60))
    with layer(ctx, cam, t):
        # в бассейне плещутся
        for i, x in enumerate((1700, 2000, 2350)):
            p = R.stand("front", t, i)
            p.update(face="laugh", a1=(2.4 + 0.4 * math.sin(t * 5 + i), 0.3), a2=(2.2, 0.3))
            R.Fig(LIVE[(i + 2) % 6]).draw(ctx, x, DK.GF + 150 + math.sin(t * 2 + i) * 6, 92, 1, p)
        # кто-то вылетает из горки
        k = (t * 0.45) % 1.0
        if k < 0.5:
            u = k / 0.5
            x = lerp(3640, 3760, u)
            y = lerp(790, 900, u) - math.sin(u * math.pi) * 60
            p = R.stand("side", t, 9)
            p.update(face="laugh", a1=(2.8, 0.2), a2=(2.6, 0.2), k1=(1.3, 0.2), k2=(1.2, 0.3))
            R.Fig(LIVE[3]).draw(ctx, x, y + 120, 85, 1, p)
        if 0.48 < k < 0.8:
            SEA.splash(ctx, 3760, DK.GF + 10, (k - 0.48) / 0.32, 0.8, seed=2)
        DK.water(ctx, t, *DK.POOL, DK.GF + 14, tod="day")
        DK.water(ctx, t, DK.SPLASH[0] + 20, DK.SPLASH[1] - 20, DK.GF + 12, 100, "day")
        party_crowd(ctx, t)
        tilt = math.sin(t * 3.1) * 0.06
        w.draw(ctx, LEO, t, {"face": "smile", "h1": (0.55, -2.95)},
               props=lambda c, J, l: tray(c, J, "hand1", tilt) if l == "front" else None)
    for i, (x, y) in enumerate(((560, 300), (1400, 260), (900, 420))):
        ph = (t * 0.8 + i * 0.33) % 1
        D.text(ctx, "♪", x + ph * 60, y - ph * 120, 70, D.FONT_HAND, hexrgb("#fff6d8"), alpha=1 - ph,
               stroke=D.INK, slw=6)


# --- 3. укус -------------------------------------------------------------------------------

def shot_bite(ctx, t, S):
    tb = S.cue(2, True) - (S.cue(2) + 2.4) - 0.7       # момент укуса от начала плана
    tb = max(tb, 1.0)
    cam = Cam(Keys((0, 1280), (tb, 1230)), Keys((0, 720), (tb, 700)),
              Keys((0, 1.25), (tb - 0.05, 1.35), (tb + 0.15, 2.0, "out")),
              shake=lambda tt: shake_k(tt, tb, 0.5, 1.0))
    deck_back(ctx, t, cam, "day", 1.0, sun=(2400, 0, 60))
    with layer(ctx, cam, t):
        party_crowd(ctx, t, skip=(0, 1, 10))
        # капитан болтает у бара
        cx = 1250
        pc = R.stand("side", t, 3)
        if t < tb:
            pc.update(face="laugh", a1=(0.5 + 0.3 * math.sin(t * 4), 1.0), hturn=0.8)
        else:
            k = clamp((t - tb) / 0.3)
            pc.update(face="scream", blink=0, lean=-0.25 * k, a1=(2.6, 0.4), a2=(2.2, 0.8), hturn=0.9)
        CAPTAIN.draw(ctx, cx, 1000, deck_s(1000), 1, pc)
        # мужчина в гавайской рубашке подкрадывается слева
        zl = R.zombie_look(77, "hawaiian")
        zx = Keys((0, 900), (tb - 0.25, 1080), (tb, 1185, "in"))(t)
        if t < tb - 0.25:
            pz = R.gait(t * 0.8, "shamble", "side", 5)
        else:
            pz = zombie_reach(t, 5)
            pz.update(lean=0.45, neck=0.4, mouth=1.0 if t < tb + 0.1 else 0.3)
        R.Fig(zl).draw(ctx, zx, 1010, deck_s(1010), 1, pz)
        # Лео с подносом оборачивается
        pl = R.stand("side", t, 1)
        pl.update(h1=(0.55, -2.95), face="smile" if t < tb else "shock", blink=0 if t > tb else pl.get("blink", 0),
                  hturn=0.2 if t > tb + 0.1 else 0.8)
        LEO.draw(ctx, 1560, 1090, deck_s(1090) * 1.05, -1, pl,
                 extra=lambda c, J, l: tray(c, J, "hand1", 0.0 if t < tb else 0.12 * math.sin((t - tb) * 30)
                                            * clamp(1 - (t - tb))) if l == "front" else None)
    if t >= tb:
        impact(ctx, *cam.to_screen(t, 1210, 590), clamp((t - tb) / 0.35), 150)
    pop_text(ctx, "CHOMP!", 1180, 300, t, tb, 170, "#e8423c", rot=-0.1)


# --- 4. «шесть минут спустя»: хаос по всей палубе ---------------------------------------------

def shot_chaos(ctx, t, S):
    cam = Cam(Keys((0, 1900), (6, 2200)), Keys((0, 560), (6, 640)), Keys((0, 0.5), (6, 0.62)), drift=1.5)
    deck_back(ctx, t, cam, "day", 1.0, sun=(2400, 0, 60), mess=0.6)
    with layer(ctx, cam, t):
        r = rng(31)
        for i in range(34):
            y = r.uniform(900, 1130)
            x0 = r.uniform(-500, 4000)
            if r.random() < 0.28:
                Runner(R.Fig(LIVE[i % 6]), x0, y, r.choice((-1, 1)) * r.uniform(380, 520), seed=i,
                       panic=True).draw(ctx, t)
            else:
                v = r.uniform(70, 140) * r.choice((-1, 1))
                Runner(R.Fig(R.zombie_look(500 + i)), x0, y, v, kind="shamble", seed=i).draw(ctx, t)
        for i, x in enumerate((1600, 1900, 2250, 2450)):
            p = zombie_reach(t, i)
            R.Fig(R.zombie_look(600 + i, "trunks")).draw(ctx, x + math.sin(t + i) * 20, DK.GF + 150, 92, 1 - 2 * (i % 2), p)
        DK.water(ctx, t, *DK.POOL, DK.GF + 14, tod="day", slosh=0.3)
    D.rrect(ctx, W / 2 - 260, 150, 520, 110, 20, hexrgb("#fff6d8"), D.INK, 6)
    D.text(ctx, "6 MINUTES LATER", W / 2, 225, 52, D.FONT_TITLE, D.INK)


# --- 5. бокалы падают -------------------------------------------------------------------------

def shot_drop(ctx, t, S):
    cam = Cam(1560, 760, Keys((0, 1.9), (1.2, 2.1)), shake=lambda tt: shake_k(tt, 0.55, 0.4, 0.5))
    deck_back(ctx, t, cam, "day", 1.0, sun=(2400, 0, 60), mess=0.6)
    with layer(ctx, cam, t):
        pl = R.stand("side", t, 1)
        pl.update(face="scream", blink=0, a1=(0.9, 0.6), a2=(0.6, 0.8), lean=-0.05)
        LEO.draw(ctx, 1500, 1060, 105, 1, pl)
        r = rng(4)
        for k in range(7):
            gx = 1600 + k * 16
            dt = t - 0.05 * k
            y = 760 + 900 * max(0, dt) ** 2
            if y < 1040:
                ctx.save()
                ctx.translate(gx + dt * 60, y)
                ctx.rotate(dt * 6 * (1 if k % 2 else -1))
                D.poly(ctx, [(-8, 0), (8, 0), (11, -30), (-11, -30)], hexrgb("#e8f8ff"), D.INK, 2, wob=0)
                ctx.restore()
            else:
                kk = clamp((t - 0.55) / 0.6)
                for j in range(5):
                    a = -math.pi / 2 + r.uniform(-1.3, 1.3)
                    v = r.uniform(80, 220)
                    sx = gx + math.cos(a) * v * kk
                    sy = 1045 + math.sin(a) * v * kk + 300 * kk * kk
                    D.poly(ctx, [(sx, sy), (sx + 8, sy - 3), (sx + 3, sy + 8)], hexrgb("#e8f8ff"), D.INK, 1.5, wob=0)
    pop_text(ctx, "CRASH!", 1300, 330, t, 0.55, 160, "#7fd0ff")


# --- 6. бег к трапу и вверх ------------------------------------------------------------------

LADDER_TOP = 110


def shot_run(ctx, t, S):
    T_RUN = 2.1                    # добежал до трапа
    lx = DK.LADDER_X
    run_x = Keys((0, 2900), (T_RUN, lx - 30, "lin"))
    climb_u = lambda tt: clamp((tt - T_RUN - 0.1) / 2.2) * ((1010 - LADDER_TOP) / 100.0)
    s = 100
    def cam_y(tt):
        return 700 - clamp((tt - T_RUN) / 2.4) * 520
    cam = Cam(lambda tt: min(run_x(tt) + 200, lx + 60), cam_y, Keys((0, 0.95), (T_RUN, 1.05)), drift=1.0)
    deck_back(ctx, t, cam, "day", 1.0, sun=(2400, 0, 60), mess=0.6)
    with layer(ctx, cam, t):
        # дверь на площадке наверху
        D.rect(ctx, lx + 60, -260, 260, 370, hexrgb("#e8eef0"), D.INK, 4, wob=0)
        D.rrect(ctx, lx + 120, -200, 120, 310, 12, hexrgb("#8a96a0"), D.INK, 4)
        D.rect(ctx, lx + 125, -170, 110, 60, hexrgb("#f2c230"), D.INK, 2, wob=0)
        D.text(ctx, "CREW", lx + 180, -138, 28, D.FONT_TITLE, D.INK)
        D.text(ctx, "ONLY", lx + 180, -114, 22, D.FONT_TITLE, D.INK)
        # погоня
        for i in range(7):
            zx = Keys((0, 2300 - i * 120), (T_RUN + 0.9, lx - 140 - (i % 3) * 90))(t)
            zy = 1010 + (i % 3) * 30
            at = abs(zx - (lx - 140 - (i % 3) * 90)) < 5
            p = zombie_reach(t, i) if at else R.gait(t * 1.6 + i * 0.3, "shamble", "side", i)
            if at:
                p.update(a1=(2.5 + 0.2 * math.sin(t * 6 + i), 0.2), a2=(2.3, 0.3), lean=-0.05, mouth=0.9)
            R.Fig(R.zombie_look(520 + i)).draw(ctx, zx, zy, deck_s(zy), 1, p)
        if t < T_RUN:
            w = Walk(run_x, 1010, s, "run", t1=4)
            w.draw(ctx, LEO, t, {"face": "scream", "blink": 0})
        else:
            u = climb_u(t)
            if u < (1010 - LADDER_TOP) / 100.0:
                draw_climber(ctx, LEO, lx, 1010, s, u, 1, "back", "scream")
            else:
                k = clamp((t - T_RUN - 2.3) / 0.6)
                pl = R.gait(k * 2, "run", "side", 1)
                pl.update(face="scream", blink=0)
                if k < 1:
                    LEO.draw(ctx, lerp(lx, lx + 180, k), LADDER_TOP, s, 1, pl, alpha=1 - clamp((k - 0.7) / 0.3))
    if T_RUN + 2.9 < t < T_RUN + 3.6:
        pop_text(ctx, "SLAM!", W / 2 + 300, 260, t, T_RUN + 2.9, 140, "#fff6d8")


# --- 7. мостик пуст ---------------------------------------------------------------------------

def shot_bridge(ctx, t, S):
    cam = Cam(Keys((0, 900), (4, 1000)), Keys((0, 560), (4, 600)), Keys((0, 0.85), (4, 1.0)), drift=0.6)
    ang = t * 0.12
    bridge_back(ctx, t, cam, "day", 1.0, sun=(2100, 120, 50), wheel_ang=ang)
    with layer(ctx, cam, t):
        pl = R.stand("side", t, 1)
        breath = math.sin(t * 7) * 0.04
        pl.update(face="scared", blink=0, lean=-0.12 + breath, a1=(-0.3, 0.3), a2=(-0.5, 0.4), hturn=0.7,
                  look=(0.6, 0.0))
        LEO.draw(ctx, BR.DOOR_X + 170, BR.BF + 40, 120, 1, pl)
        # хвост кошки из-под пульта (пасхалка)
        D.curve(ctx, [(2290, 830), (2330, 800 + math.sin(t * 3) * 10), (2360, 760)], D.INK, 18)
        D.curve(ctx, [(2290, 830), (2330, 800 + math.sin(t * 3) * 10), (2360, 760)], hexrgb("#f28a2c"), 11)
    for k in range(2):
        ph = (t * 0.7 + k * 0.5) % 1
        x, y = cam.to_screen(t, BR.DOOR_X + 260, 420)
        D.text(ctx, "huff", x + 40 + ph * 60, y - ph * 80, 46, D.FONT_HAND, D.INK, alpha=1 - ph)


def build(S):
    c = S.cue
    t_bite = c(2) + 2.4
    S.shots = [
        Shot(0, shot_aerial),
        Shot(c(1) - 0.4, shot_party, "white", 0.4),
        Shot(t_bite, shot_bite),
        Shot(c(3) - 0.2, shot_chaos, "whip", 0.3),
        Shot(c(4) - 0.1, shot_drop),
        Shot(c(4) + 1.1, shot_run),
        Shot(c(5) - 0.3, shot_bridge, "black", 0.3),
    ]
    S.sfx += [(t_bite + max(1.0, c(2, True) - t_bite - 0.7), "chomp", 1.0), (c(4) + 0.45, "glass", 1.0),
              (c(4) + 1.1 + 5.0, "door_slam", 0.9)]
    S.music = "party"
