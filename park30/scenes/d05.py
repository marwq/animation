"""День 5: правило третье — они не умеют лазать: ни лестницы, ни заборы, ни даже детская горка. Ты уходишь
наверх: мостки, пути горок и канатная дорога Sky Ride — кабинки на тросе через весь парк. Твоё шоссе в небе."""
from scenes.kit import *
from scenes.shared import *

SLIDE_X = 1300
TOWER_X = 1200       # опора канатки с лестницей
TOWER_H = 1700
CABLE = RD.sky_ride_cable(TOWER_X, PK.FL - TOWER_H - 10, TOWER_X + 7000, PK.FL - TOWER_H + 100, 260)


def ladder(ctx, x, y0, y1, w=90, c="#8f99a3", s=112.0):
    """Вертикальная лестница от y0 (низ) до y1 (верх); перекладины с шагом RUNG·s."""
    D.line(ctx, x - w / 2, y0, x - w / 2, y1, D.INK, 12)
    D.line(ctx, x + w / 2, y0, x + w / 2, y1, D.INK, 12)
    D.line(ctx, x - w / 2, y0, x - w / 2, y1, hexrgb(c), 6)
    D.line(ctx, x + w / 2, y0, x + w / 2, y1, hexrgb(c), 6)
    y = y0 - RUNG * s
    while y > y1:
        D.line(ctx, x - w / 2, y, x + w / 2, y, D.INK, 9)
        D.line(ctx, x - w / 2, y, x + w / 2, y, hexrgb(c), 4)
        y -= RUNG * s


def shot_slide(ctx, t, S):
    """Детская горка: зомби лезет по скату и съезжает; другой бьётся о лестницу. Затем правило."""
    d = S.cue(1) - 0.1
    T_RULE = S.word("rule", 0.0, 1.4) - 0.15                  # врезка-карточка: «Rule number three. They can't climb.»
    T_BACK = S.word("not", T_RULE + 0.5, T_RULE + 2.5) - 0.1
    if T_RULE <= t < T_BACK:
        D.vgrad(ctx, 0, 0, W, H, [(0, "#2a2448"), (1, "#141030")])
        rule_card(ctx, t, 3, ["They can't", "CLIMB."], T_RULE)
        return
    cam = Cam(SLIDE_X + 150, 560, 1.0)
    grass_back(ctx, t, cam, "day", -2000, 5000, c="#bfe68a")
    with layer(ctx, cam, t):
        PK.fence(ctx, -1000, 700, PK.FL - 30, 220, "day")
        RD.kiddie_slide(ctx, SLIDE_X, PK.FL + 20, 1.9, "day")
        # зомби у лестницы горки: тянется к перекладине и падает назад
        cyc = (t % 1.6) / 1.6
        p = zombie_reach(t, 1)
        p.update(h1=(0.6, -3.2 - 0.3 * math.sin(cyc * TAU)), h2=(0.5, -3.0), lean=-0.1 + 0.25 * math.sin(cyc * TAU))
        R.Fig(R.park_zombie(5001, "dad")).draw(ctx, SLIDE_X - 560, PK.FL + 20, 112, 1, p)
        # зомби на скате: вскарабкался на четвереньках — съехал
        u = (t % 1.3) / 1.3
        up = u < 0.7
        k = (u / 0.7) if up else 1 - (u - 0.7) / 0.3
        sx = lerp(SLIDE_X + 560, SLIDE_X + 280, k)
        sy = lerp(PK.FL - 10, PK.FL - 360, k ** 1.3)
        q = R.stand("side", t, 2)
        q.update(lean=0.95, hip=(0, 0.5), h1=(1.0, -0.4), h2=(0.8, -0.4), f1=(-0.3, 0), f2=(-0.5, 0), mouth=0.8,
                 face="scared" if not up else "neutral")
        R.Fig(R.park_zombie(5002, "kid")).draw(ctx, sx, sy, 112, -1, q)
        # у забора зомби пытается перелезть
        p = zombie_reach(t, 3)
        p.update(h1=(0.5, -3.4 - 0.2 * math.sin(t * 5)), h2=(0.4, -3.3 + 0.2 * math.sin(t * 5)))
        R.Fig(R.park_zombie(5003, "tourist")).draw(ctx, 300, PK.FL - 30, 105, -1, p)
    if not up:
        pop_text(ctx, "WHEE—OOF", W / 2 + 470, 300, t, int(t / 1.3) * 1.3 + 0.91, 80, "#9fc86a", dur=0.5)


def shot_up(ctx, t, S):
    """Раскал лезет по лестнице опоры канатки; камера поднимается — сверху другой мир."""
    d = S.cue(2) - S.cue(1)
    T_TOP = d * 0.55
    prog = (TOWER_H - 120) / 112 * smooth(clamp(t / T_TOP))
    cam = Cam(Keys((0, TOWER_X + 200), (d, TOWER_X + 900)), Keys((0, 400), (T_TOP, PK.FL - TOWER_H - 100),
                                                                 (d, PK.FL - TOWER_H - 60)),
              Keys((0, 0.9), (T_TOP, 0.7), (d, 0.42, "io")))
    D.rect(ctx, 0, 0, W, H, hexrgb("#a8d878"), None, 0, wob=0)
    with layer(ctx, cam, t, 0.3):
        PK.sky(ctx, t, "day", -3000, 12000, sun=(7000, -2200, 130))
    with layer(ctx, cam, t, 0.5):
        PK.far_lake(ctx, t, "day", -3000, 12000, lighthouse_x=6000)
    with layer(ctx, cam, t):
        PK.plaza(ctx, "day", -3000, 12000, c="#a8d878")
        # мир наверху: колесо, пути горок, мостки на опорах, трос канатки
        RD.big_wheel(ctx, 5600, PK.FL - 1700, 1300, t * 0.2, "day", t=t, gy=PK.FL)
        tr = RD.Track(RD.thunderbolt_track(1900, PK.FL, 2300))
        RD.coaster_track(ctx, tr, PK.FL, "day", lattice_until=2300)
        for k in range(4):
            D.line(ctx, 1850 + k * 450, PK.FL - 980, 1850 + k * 450, PK.FL, D.INK, 14)
            D.line(ctx, 1850 + k * 450, PK.FL - 980, 1850 + k * 450, PK.FL, hexrgb("#8f99a3"), 7)
        D.rect(ctx, 1800, PK.FL - 980, 1450, 26, hexrgb("#8f99a3"), D.INK, 4, wob=0)        # мостки
        for k in range(15):
            D.line(ctx, 1800 + k * 100, PK.FL - 980, 1800 + k * 100, PK.FL - 1060, D.INK, 4)
        D.line(ctx, 1800, PK.FL - 1060, 3250, PK.FL - 1060, D.INK, 6)
        RD.sky_tower(ctx, TOWER_X, PK.FL, TOWER_H, "day")
        RD.cable(ctx, CABLE, tod="day")
        for k in range(5):
            x, y = CABLE((k / 5 + 0.08 + t * 0.012) % 1)
            RD.sky_bucket(ctx, x, y, 1.0, PK.BRIGHT[k], "day", sway=0.05 * math.sin(t + k))
        ladder(ctx, TOWER_X - 140, PK.FL, PK.FL - TOWER_H + 40)
        draw_climber(ctx, RASCAL, TOWER_X - 140, PK.FL, 112, prog, 1, "back")
        for i in range(4):
            p = zombie_reach(t, i)
            p.update(a1=(2.4, -0.2), a2=(2.2, -0.1), neck=-0.4)
            R.Fig(R.park_zombie(5010 + i)).draw(ctx, TOWER_X - 520 + i * 260, PK.FL + 60 + (i % 2) * 40, 108,
                                               1 if i < 2 else -1, p)
    if t > T_TOP:
        pop_text(ctx, "UP HERE...", W / 2, 220, t, T_TOP, 90, "#fff6d8", dur=d, shake=False)


def shot_bucket(ctx, t, S):
    """В кабинке: Раскал и Бандит, внизу парк и зомби, задирающие головы."""
    d = S.cue(3) - S.cue(2)
    u0 = 0.2
    v = 0.035
    cam = Cam(lambda q: CABLE(u0 + v * q)[0] + 60, lambda q: CABLE(u0 + v * q)[1] + 260, 1.05)
    with layer(ctx, cam, t, 0.3):
        PK.sky(ctx, t, "day", -3000, 12000, sun=(7000, -2200, 130))
    with layer(ctx, cam, t, 0.6):
        PK.far_lake(ctx, t, "day", -3000, 12000)
    with layer(ctx, cam, t):
        RD.cable(ctx, CABLE, tod="day")
        x, y = CABLE(u0 + v * t)

        def riders(c, bx, by):
            p = sit_pose(t, 1, "happy")
            p.update(h1=(0.9, -2.6), h2=(0.5, -1.9))
            RASCAL.draw(c, -40, by + 55, 60, 1, rascal_pose(p, "happy"))
            draw_raccoon(c, 50, by - 30, 50, 1, raccoon_pose(t, "sit", look=0.3))
        RD.sky_bucket(ctx, x, y, 1.6, "#e8423c", "day", riders, sway=0.06 * math.sin(t * 1.3))
    pop_text(ctx, "SKY RIDE", W / 2 + 380, 220, t, 0.2, 90, "#ffd23a", dur=d, shake=False)


def shot_highway(ctx, t, S):
    """Сверху: кабинка плывёт над Главной улицей; толпа внизу тянется — не достать."""
    d = S.dur - S.cue(3)
    u0 = 0.35
    v = 0.03
    cam = Cam(lambda q: CABLE(u0 + v * q)[0], lambda q: CABLE(u0 + v * q)[1] + 760, 0.47)
    with layer(ctx, cam, t, 0.3):
        PK.sky(ctx, t, "day", -3000, 14000, sun=(9000, -2200, 130))
    with layer(ctx, cam, t):
        bg(ctx, "street_hw", (1000, -500, 8000, 2400), lambda c: (PK.main_street(c, "day", 1000, 9000),
                                                                PK.plaza(c, "day", 1000, 9000)), 0.5)
        crowd_floor(ctx, t, 51, 60, 1500, 8500, PK.FL + 40, PK.FL + 300, 100, 120, vx=(-20, 20),
                    pose_fn=lambda m, tt: dict(zombie_reach(tt, m.seed % 97), a1=(2.5, -0.2), a2=(2.3, -0.1),
                                               neck=-0.5))
        RD.cable(ctx, CABLE, tod="day")
        x, y = CABLE(u0 + v * t)

        def riders(c, bx, by):
            p = sit_pose(t, 1, "laugh")
            p.update(h1=(1.2, -2.5 - 0.3 * math.sin(t * 8)), h2=(0.5, -1.9))
            RASCAL.draw(c, -40, by + 55, 60, 1, rascal_pose(p, "happy"))
            draw_raccoon(c, 50, by - 30, 50, 1, raccoon_pose(t, "sit", look=0.3))
        RD.sky_bucket(ctx, x, y, 1.0, "#e8423c", "day", riders, sway=0.05 * math.sin(t * 1.3))
        for k in range(1, 4):
            bx, by = CABLE((u0 + v * t + k * 0.12) % 1)
            RD.sky_bucket(ctx, bx, by, 1.0, PK.BRIGHT[k + 2], "day", sway=0.05 * math.sin(t + k))
    pop_text(ctx, "PRIVATE HIGHWAY", W / 2, 200, t, 0.3, 90, "#ffd23a", dur=d, shake=False)


def build(S):
    c = S.cue
    S.shots = [
        Shot(0, shot_slide, "fade", 0.4),
        Shot(c(1) - 0.1, shot_up, "fade", 0.3),
        Shot(c(2) - 0.1, shot_bucket, "fade", 0.3),
        Shot(c(3) - 0.1, shot_highway, "fade", 0.3),
    ]
    S.tods = [(0, "day")]
    S.sfx += [(0.9, "slide_squeak", 0.8), (4.8, "slide_squeak", 0.8), (S.word("rule", 0.0, 1.4) - 0.15, "stamp", 0.9),
              (c(1) + 0.2, "ladder", 0.8), (c(2), "cable_hum", 0.8), (c(3), "wind", 0.6)]
    S.music = [(0, "comic", 0.8), (c(1), "wonder", 1.0)]
