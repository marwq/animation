"""День 8: в магазине игрушек у C2 — радиоуправляемый самолётик. Полёт по пустой галерее, над
дорожками, вокруг скелета динозавра. Все зомби внизу идут за жужжанием, как на параде. Посадка на
багажную карусель. Лучший день в жизни. Запомни игрушку."""
from scenes.kit import *
from scenes.shared import *

CX = TM.gate_xs("C")[1]


def shot_store(ctx, t, S):
    d = S.cue(1) - 0.1
    cam = Cam(Keys((0, CX - 900), (d, CX - 820)), 520, Keys((0, 1.0), (d, 1.15)))
    term_back(ctx, t, cam, "day", 1.0, "C")
    with layer(ctx, cam, t):
        p = R.stand("side", t, 1)
        p.update(face="laugh", h1=(0.7, -2.6), h2=(0.6, -2.4), hturn=0.7)
        J = DANNY_JACKET.draw(ctx, CX - 1000, TM.FL + 60, 115, 1, p)
        hx, hy = DANNY_JACKET.world(CX - 1000, TM.FL + 60, 115, 1, J["hand1"])
        D.rrect(ctx, hx - 20, hy - 140, 200, 150, 14, hexrgb("#2f8fd8"), D.INK, 4)
        PL.rc_plane(ctx, hx + 80, hy - 70, 0.8, 1, 0.0)
        draw_lab(ctx, CX - 1250, TM.FL + 60, 105, 1, dog_pose(t, "sit", wag=1.0))
    pop_text(ctx, "WHOA.", W / 2 + 300, 260, t, 0.4, 110, "#ffe36a", dur=d)


def plane_path(u):
    """Путь самолётика в главном зале: заход справа, круг вокруг шеи динозавра."""
    if u < 0.5:
        k = u / 0.5
        return lerp(4200, 2200, k), lerp(-200, -500, k) + math.sin(k * 6) * 40, -1
    k = (u - 0.5) / 0.5
    a = k * TAU * 1.1
    return 1500 + math.cos(a) * 700, -700 + math.sin(a) * 260, -1 if math.sin(a) > 0 else 1


def shot_fly(ctx, t, S):
    d = S.cue(2) - S.cue(1)
    T_HALL = d * 0.4
    if t < T_HALL:
        cam = Cam(lambda q: CX + 600 - q * 900, 420, 0.75)
        term_back(ctx, t, cam, "day", 1.0, "C")
        with layer(ctx, cam, t):
            TM.walkway(ctx, CX - 2400, CX + 1400, TM.FL + 150, t, "day")
            x = CX + 500 - t * 900
            y = 340 + math.sin(t * 3) * 60
            PL.rc_plane(ctx, x, y, 1.4, -1, t, 0.1 * math.sin(t * 3))
            motion_lines(ctx, *cam.to_screen(t, x + 120, y), 1, 4, 140, 26, a=0.6)
        pop_text(ctx, "bzzzz", W / 2 + 200, 300, t, 0.2, 70, "#fff6d8", dur=T_HALL, shake=False)
        return
    tt = t - T_HALL
    cam = Cam(1600, -200, Keys((0, 0.55), (d - T_HALL, 0.6)))
    hall_back(ctx, tt, cam, "day", 1.0)
    with layer(ctx, cam, tt):
        u = clamp(tt / (d - T_HALL))
        x, y, f = plane_path(u)
        PL.rc_plane(ctx, x, y, 1.6, f, tt, 0.3 * f)
        for k in range(8):
            u2 = max(0, u - k * 0.02)
            px, py, _ = plane_path(u2)
            D.circle(ctx, px, py, 10 - k, hexrgb("#fff6d8"), None, 0, alpha=0.5 - k * 0.05)


def shot_parade(ctx, t, S):
    d = S.cue(3) - S.cue(2)
    cam = Cam(Keys((0, 1300), (d, 1700)), 380, 0.55)
    hall_back(ctx, t, cam, "day", 1.0)
    with layer(ctx, cam, t):
        px = 2600 + t * 150
        PL.rc_plane(ctx, px, 300 + math.sin(t * 4) * 40, 1.5, 1, t, 0.1)
        for i in range(26):
            x = px - 200 - i * 120
            y = TM.FL + 40 + (i % 3) * 70
            p = R.gait(t * 1.6 + i * 0.25, "shamble", "side", i)
            p.update(neck=-0.6, look=(0.3, -1), a1=(2.0, -0.2), a2=(1.8, 0.0), mouth=0.8)
            R.Fig(R.zombie_look(800 + i)).draw(ctx, x, y, floor_s(y, s=100), 1, p)
    for k in range(5):
        r = rng(k)
        ph = (t * 0.7 + k / 5) % 1
        D.rect(ctx, r.uniform(0, W), ph * H, 16, 26, hexrgb(["#e8423c", "#f2c230", "#2f8fd8", "#3fbf6a"][k % 4]),
               None, 0, wob=0)
    pop_text(ctx, "PARADE!", W / 2, 220, t, 0.4, 130, "#ffe36a", dur=d)


def shot_land(ctx, t, S):
    d = S.dur - S.cue(3)
    T_LAND, T_STAMP = 1.0, max(2.0, S.cue(3, True) - S.cue(3) - 1.4)
    if t < T_STAMP:
        cam = Cam(1250, 560, Keys((0, 0.95), (T_STAMP, 1.1)))
        room_back(ctx, t, cam, "claim", lambda c: TM.baggage_claim(c, 0.0), (-800, -1500, 4400, 3300))
        with layer(ctx, cam, t):
            RM.bags(ctx, 300, 2300, TM.FL - 172, t, 1.0, seed=4, gap=320)
            k = clamp(t / T_LAND)
            if t < T_LAND:
                x, y = lerp(2600, 1400, k), lerp(300, TM.FL - 200, ease_out(k))
            else:
                x, y = 1400 + ((t - T_LAND) * 160) % 900, TM.FL - 200
            PL.rc_plane(ctx, x, y, 1.0, -1 if t < T_LAND else 1, t, 0.0)
            p = R.stand("side", t, 1)
            cheer = t > T_LAND
            p.update(face="laugh" if cheer else "happy", a1=(2.7, 0.3) if cheer else (0.6, -0.2),
                     a2=(2.5, 0.3) if cheer else (0.5, -0.1), hturn=0.7)
            DANNY_JACKET.draw(ctx, 700, TM.FL + 80, 118, 1, p)
            draw_lab(ctx, 450, TM.FL + 80, 105, 1, dog_pose(t, "sit", wag=1.0, bark=0.6 if cheer else 0.0))
        if t > T_LAND:
            pop_text(ctx, "BEST DAY EVER", W / 2, 230, t, T_LAND, 100, "#ffe36a", dur=T_STAMP - T_LAND)
        return
    tt = t - T_STAMP
    D.vgrad(ctx, 0, 0, W, H, [(0, "#2a2448"), (1, "#141030")])
    PL.rc_controller(ctx, W / 2 - 300, H / 2 + 40, 2.2, bars=3)
    PL.rc_plane(ctx, W / 2 + 380, H / 2 - 80, 2.4, -1, tt, 0.1)
    k = ease_out_back(clamp((tt - 0.3) / 0.25))
    if k > 0:
        ctx.save()
        ctx.translate(W / 2, H / 2 + 300)
        ctx.rotate(-0.06)
        ctx.scale(k, k)
        D.rrect(ctx, -520, -80, 1040, 160, 24, None, hexrgb("#e8423c"), 12)
        D.text(ctx, "REMEMBER THE TOY", 0, 30, 90, D.FONT_TITLE, hexrgb("#e8423c"))
        ctx.restore()


def build(S):
    c = S.cue
    S.shots = [
        Shot(0, shot_store),
        Shot(c(1) - 0.1, shot_fly, "whip", 0.25),
        Shot(c(2) - 0.1, shot_parade, "fade", 0.25),
        Shot(c(3) - 0.1, shot_land, "whip", 0.25),
    ]
    ts = c(3) + max(2.0, c(3, True) - c(3) - 1.4)
    S.sfx += [(c(1), "rc_buzz", 0.9), (c(2), "rc_buzz", 0.7), (c(3) + 1.0, "ding", 0.8), (ts + 0.3, "stamp", 1.0)]
    S.music = [(0, "fun", 1.0), (ts, "mystery", 0.6)]
