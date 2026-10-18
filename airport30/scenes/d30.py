"""День 30: шесть утра. Все динамики: «Последняя посадка» — три тысячи бегут к A1. Ворота ангара
открываются, самолётик жужжит над рулёжкой и уводит последних к озеру. Почти последних. Полный газ.
Рози катится. Они разворачиваются и бегут навстречу. Восемьсот футов. На себя. Шасси оторвались."""
from scenes.kit import *
from scenes.shared import *
from scenes.d11 import hangar_bg, ROSIE_X
from scenes.cold import cabin_faces, runway_run, panel_overlay

SUN = (W / 2 + 120, 480, 90)


def timer(ctx, t, txt, hot=0.0):
    D.vgrad(ctx, 0, 0, W, H, [(0, "#3a5aa8"), (0.7, "#e88aa0"), (1, "#ffd49a")])
    ctx.save()
    ctx.translate(W / 2, H / 2)
    ctx.scale(1 + 0.04 * hot, 1 + 0.04 * hot)
    D.rrect(ctx, -520, -260, 1040, 520, 50, hexrgb("#3a3f4a"), D.INK, 10)
    D.rrect(ctx, -440, -180, 880, 260, 20, hexrgb("#0e1410"), D.INK, 6)
    if hot > 0:
        fx.glow(ctx, 0, -50, 600, "#ff4a3a", 0.35 * hot)
    D.text(ctx, txt, 0, 40, 220, D.FONT_TITLE, hexrgb("#ff4a3a"))
    D.text(ctx, "DAY 30", 0, 180, 70, D.FONT_TITLE, hexrgb("#fff6d8"))
    D.circle(ctx, 420, 180, 30, hexrgb("#4cff8a"), D.INK, 5)
    ctx.restore()


def shot_six(ctx, t, S):
    d = S.cue(1) - 0.1
    T_FLIP = min(0.9, d * 0.4)
    hot = clamp(1 - (t - T_FLIP) / 0.6) if t > T_FLIP else 0.0
    timer(ctx, t, "06:00" if t > T_FLIP else "05:59", hot)
    if t > T_FLIP:
        pop_text(ctx, "BEEP!", W / 2 + 560, 260, t, T_FLIP, 120, "#ff4a3a", dur=d)


def run_crowd(ctx, t, n=60, seed=30, tod="dawn"):
    r = rng(seed)
    for i in range(n):
        y = TM.FL + r.uniform(0, 520)
        s = floor_s(y, s=95)
        x0 = r.uniform(-1300, 4400)
        v = r.uniform(500, 760)
        x = x0 - v * t
        p = R.gait(v * t / s / R.GAITS["run"]["L"] + i * 0.3, "run", "side", i)
        p.update(a1=(1.4, -0.1), a2=(1.2, 0.0), mouth=0.9, lean=0.35)
        R.Fig(R.zombie_look(3000 + i)).draw(ctx, x, y, s, -1, p)


def shot_call(ctx, t, S):
    d = S.cue(2) - S.cue(1)
    T_RUN = d * 0.45
    if t < T_RUN:
        D.vgrad(ctx, 0, 0, W, H, [(0, "#1c3f7c"), (1, "#0e1e40")])
        pts = [(260, 300), (W - 260, 300), (260, 820), (W - 260, 820)]
        speakers(ctx, t, pts, 1.0, "#ffd23a")
        txt = "THIS IS THE FINAL BOARDING CALL · FLIGHT 30 · GATE A1 · "
        D.rrect(ctx, 420, 440, W - 840, 200, 30, hexrgb("#15181f"), D.INK, 8)
        ctx.save()
        ctx.rectangle(440, 460, W - 880, 160)
        ctx.clip()
        D.text(ctx, txt, W - 440 - t * 700, 580, 96, D.FONT_TITLE, hexrgb("#ffd23a"), "left")
        ctx.restore()
        clock_badge(ctx, "06:00", t, W / 2 + 100, 150)
        return
    tt = t - T_RUN
    cam = Cam(Keys((0, 1300), (3, 800)), 300, 0.5)
    hall_back(ctx, tt, cam, "dawn", 1.0)
    with layer(ctx, cam, tt):
        run_crowd(ctx, tt)
    n = int(3000 * clamp(tt / ((d - T_RUN) * 0.7)))
    counter_badge(ctx, "TO A1", n, W - 300, 160, "#ff4a3a", 440)


def shot_doors(ctx, t, S):
    d = S.cue(3) - S.cue(2)
    T_OUT = d * 0.45
    if t < T_OUT:
        k = smooth(clamp(t / (T_OUT * 0.8)))
        cam = Cam(Keys((0, 1700), (T_OUT, 2100)), 560, 0.62)
        hangar_bg(ctx, t, cam, "dawn", 0.0, open_k=k)
        with layer(ctx, cam, t):
            PL.rosie(ctx, ROSIE_X, RM.FL + 40, 1.1, 1, "dawn")
            p = R.stand("side", t, 1)
            p.update(face="determined", h1=(0.9, -2.0), h2=(0.8, -1.9))
            J = DANNY_PILOT.draw(ctx, 2000, RM.FL + 40, 112, 1, p)
            hx, hy = DANNY_PILOT.world(2000, RM.FL + 40, 112, 1, J["hand1"])
            PL.rc_controller(ctx, hx + 10, hy, 0.6, 1)
            draw_lab(ctx, 1760, RM.FL + 40, 100, 1, dog_pose(t, "sit", headset=1.9))
            if k > 0.6:
                u = (t - T_OUT * 0.5) / (T_OUT * 0.5)
                PL.rc_plane(ctx, lerp(2300, 4200, clamp(u)), RM.FL - 200 - 200 * clamp(u), 1.3, 1, t, -0.2)
        fx.glow(ctx, W / 2 + 500, H / 2, 900 * k, "#ffc890", 0.3 * k)
        pop_text(ctx, "CLANK... CLANK...", W / 2 - 200, 230, t, 0.1, 70, "#fff6d8", dur=T_OUT * 0.8, shake=False)
        return
    tt = t - T_OUT
    cam = Cam(Keys((0, AP.HANGAR_X - 1200), (d, AP.HANGAR_X - 2300)), 520, 0.62)
    apron_back(ctx, tt, cam, "dawn", 1.0, sun=(5200, 380, 80), x0=2800, x1=8200)
    with layer(ctx, cam, tt):
        x = AP.HANGAR_X - 1200 - tt * 700
        y = 420 + math.sin(tt * 6) * 40
        PL.rc_plane(ctx, x, y, 1.4, -1, tt, 0.15 * math.sin(tt * 6))
        r = rng(30)
        for i in range(26):
            zx = AP.HANGAR_X - 1200 + r.uniform(-900, 600) - tt * 380
            zy = AP.GY + r.uniform(-60, 320)
            p = R.gait(tt * 1.6 + i * 0.3, "shamble", "side", i)
            p.update(neck=-0.5, look=(-0.3, -1), a1=(2.0, -0.2), a2=(1.8, 0.0), mouth=0.8)
            R.Fig(R.zombie_look(3100 + i)).draw(ctx, zx, zy, floor_s(zy, AP.GY, 100, 700), -1, p)
    pop_text(ctx, "BZZZZZ", W / 2 - 300, 260, tt, 0.1, 110, "#ffe36a", dur=d, shake=True)
    pop_text(ctx, "→ THE LAKE", W / 2 + 420, 200, tt, 0.6, 80, "#2f8fd8", dur=d, shake=False)


def shot_almost(ctx, t, S):
    d = S.cue(4) - S.cue(3)
    cam = Cam(AP.HANGAR_X - 1500, 640, Keys((0, 0.9), (d, 1.15)))
    apron_back(ctx, t, cam, "dawn", 1.0, sun=(5200, 380, 80), x0=3200, x1=8200)
    with layer(ctx, cam, t):
        r = rng(31)
        for i in range(7):
            zx = AP.HANGAR_X - 2300 + i * 230 + r.uniform(-40, 40)
            zy = AP.GY + 60 + r.uniform(-30, 120)
            turn_t = 0.3 + i * 0.12
            f = 1 if t > turn_t else -1
            p = zombie_idle(t, i)
            p.update(mouth=0.9 if f == 1 else 0.3)
            R.Fig(R.zombie_look(3200 + i)).draw(ctx, zx, zy, floor_s(zy, AP.GY, 120, 700), f, p)
            if t > turn_t:
                ex, ey = cam.to_screen(t, zx + 14, zy - 3.45 * floor_s(zy, AP.GY, 120, 700))
                zombie_glow_eyes(ctx, ex, ey, 12 * cam.z(t), clamp((t - turn_t) / 0.2))
    if t > 0.6:
        pop_text(ctx, "ALMOST.", W / 2, 230, t, 0.6, 130, "#e8423c", dur=d, shake=True)


def throttle(ctx, t, k):
    D.vgrad(ctx, 0, 0, W, H, [(0, "#3a3f4a"), (1, "#22252c")])
    RM.rosie_panel(ctx, W / 2 - 200, H / 2 - 40, 1.05, t, 1.0, rpm=0.1 + 0.85 * k, fuel=1.0)
    bx, by = W - 380, H / 2 + 120
    D.rrect(ctx, bx - 60, by - 260, 120, 520, 30, hexrgb("#15181f"), D.INK, 6)
    D.text(ctx, "THROTTLE", bx, by + 320, 40, D.FONT_TITLE, hexrgb("#c9d0d6"))
    ky = by + 180 - 380 * k
    D.line(ctx, bx, by + 240, bx, ky, D.INK, 22)
    D.circle(ctx, bx, ky, 56, hexrgb("#2b2f3a"), D.INK, 6)
    D.ellipse(ctx, bx + 40, ky + 30, 90, 70, hexrgb(DANNY_PILOT.look.head) if isinstance(DANNY_PILOT.look.head, str)
              else DANNY_PILOT.look.head, D.INK, 6)
    D.rect(ctx, bx + 80, ky + 10, 300, 110, DANNY_PILOT.look.body, D.INK, 6, wob=0)


def shot_takeoff(ctx, t, S):
    d = S.cue(5) - S.cue(4)
    T1, T2, T3 = d * 0.16, d * 0.34, d * 0.78
    if t < T1:
        throttle(ctx, t, smooth(clamp(t / (T1 * 0.6))))
        pop_text(ctx, "FULL POWER", W / 2 - 200, 140, t, 0.05, 100, "#4cff8a", dur=d, shake=True)
        return
    if t < T2:
        tt = t - T1
        x = AP.HANGAR_X - 300 - 300 * tt * tt
        cam = Cam(x - 200, 640, 0.8, shake=0.2)
        apron_back(ctx, tt, cam, "dawn", 1.0, sun=(5200, 380, 80), x0=3200, x1=8200)
        with layer(ctx, cam, tt):
            PL.rosie(ctx, x, AP.GY + 120, 1.0, -1, "dawn", spin=1.0, prop=tt * 40,
                     cabin=lambda c: cabin_faces(c, tt, "determined", 0.6))
            for k in range(4):
                ph = (tt * 3 + k / 4) % 1
                D.circle(ctx, x + 440 + ph * 300, AP.GY + 100 - ph * 40, 20 + 40 * ph, hexrgb("#e3dccb"), None, 0,
                         alpha=0.5 * (1 - ph))
        speed_lines(ctx, tt, n=20, a=0.25)
        pop_text(ctx, "ROSIE ROLLS.", W / 2, 230, tt, 0.05, 90, "#fff6d8", dur=d, shake=False)
        return
    if t < T3:
        tt = t - T2
        L = T3 - T2
        run = 4 + tt * 14 * (1 + tt / L)
        runway_run(ctx, t, run, approach=1.2 + tt * 3.2 / L * 2.0, sun=SUN)
        speed_lines(ctx, t, n=40, a=0.35 + 0.3 * tt / L)
        panel_overlay(ctx, t, rpm=0.98)
        ft = int(800 * (1 - tt / L))
        counter_badge(ctx, "LEFT", "%d FT" % max(0, ft), W - 330, 160, "#ff4a3a" if ft < 300 else "#ffe36a", 500)
        if tt < L * 0.45:
            pop_text(ctx, "THEY TURN.", 420, 230, tt, 0.05, 80, "#9fc86a", dur=L * 0.45, shake=False)
        else:
            pop_text(ctx, "THEY RUN.", 420, 230, tt, L * 0.45, 80, "#e8423c", dur=L, shake=True)
        return
    tt = t - T3
    cam = Cam(0, -160, Keys((0, 3.4), (d - T3, 4.2, "io")), shake=lambda q: 0.35)
    D.vgrad(ctx, 0, 0, W, H, [(0, "#3a5aa8"), (0.45, "#e88aa0"), (0.62, "#ffd49a"), (0.62, "#8a8f9a"),
                              (1, "#6b707a")])
    fx.glow(ctx, 1500, 640, 600, "#ffc890", 0.45)
    with layer(ctx, cam, tt):
        PL.rosie_front(ctx, 0, 100, 1.0, "dawn", spin=1.0, prop=tt * 40,
                       cabin=lambda c: cabin_faces(c, tt, "scream", 1.0, dog_bark=0.8))
    speed_lines(ctx, tt, n=40, a=0.4)
    pop_text(ctx, "PULL!", W / 2 + 520, 300, tt, 0.05, 170, "#ff4a3a", dur=d, shake=True)


def shot_wheels(ctx, t, S):
    d = S.dur - S.cue(5)
    T_LIFT = 0.5
    v = 1500
    x = 5200 - v * t
    lift = max(0.0, t - T_LIFT)
    gy = AP.GY + 120 - 320 * lift * (1 + lift * 0.5)
    cam = Cam(lambda q: 5200 - v * q - 250, lambda q: 640 - 0.5 * 320 * max(0.0, q - T_LIFT) * (1 + max(0, q - T_LIFT) * 0.5),
              Keys((0, 0.75), (d, 0.6)), shake=lambda q: 0.15 if q < T_LIFT else 0.05)
    apron_back(ctx, t, cam, "dawn", 1.0, sun=(1200, 300, 90), x0=-1400, x1=7000)
    with layer(ctx, cam, t):
        r = rng(32)
        for i in range(36):
            zx = 2400 + r.uniform(0, 2600) + t * r.uniform(150, 300)
            zy = AP.GY + r.uniform(40, 330)
            close = abs(zx - x) < 600
            if close or zx > x + 200:
                p = zombie_reach(t, i)
                p.update(a1=(2.7 + 0.1 * math.sin(t * 9 + i), -0.3), a2=(2.5, -0.2), mouth=1.0, lean=-0.05)
                f = -1 if zx > x else 1
            else:
                p = R.gait(t * 2.6 + i * 0.3, "run", "side", i)
                p.update(a1=(1.4, -0.1), a2=(1.2, 0.0), mouth=0.9, lean=0.35)
                f = 1
            R.Fig(R.zombie_look(3300 + i)).draw(ctx, zx, zy, floor_s(zy, AP.GY, 105, 700), f, p)
        PL.rosie(ctx, x, gy, 1.0, -1, "dawn", spin=1.0, prop=t * 40, roll=-0.18 * clamp(lift / 0.5),
                 shadow=lift < 0.2, cabin=lambda c: cabin_faces(c, t, "laugh" if lift > 0.8 else "scream", 0.8))
        if lift > 0:
            D.ellipse(ctx, x, AP.GY + 124, 380 * max(0.3, 1 - lift), 14, (0, 0, 0), None, 0,
                      alpha=0.2 * max(0.0, 1 - lift))
    speed_lines(ctx, t, n=30, a=0.3)
    if lift > 0.3:
        pop_text(ctx, "WHEELS UP.", W / 2, 220, t, T_LIFT + 0.3, 150, "#fff6d8", dur=d, shake=False)


def build(S):
    c = S.cue
    S.shots = [
        Shot(0, shot_six, "fade", 0.4),
        Shot(c(1) - 0.1, shot_call),
        Shot(c(2) - 0.1, shot_doors, "fade", 0.25),
        Shot(c(3) - 0.1, shot_almost, "whip", 0.2),
        Shot(c(4) - 0.1, shot_takeoff),
        Shot(c(5) - 0.1, shot_wheels, "whip", 0.2),
    ]
    S.tods = [(0, "dawn")]
    d4 = c(5) - c(4)
    S.sfx += [(min(0.9, (c(1) - 0.1) * 0.4), "alarm", 0.8), (c(1), "pa_chime", 1.0), (c(1) + 0.4, "pa_echo", 0.9),
              (c(1) + (c(2) - c(1)) * 0.45, "stampede", 1.0), (c(2) + 0.1, "hydraulic", 0.9),
              (c(2) + (c(3) - c(2)) * 0.4, "rc_buzz", 0.8), (c(3) + 0.3, "sting", 1.0),
              (c(3) + 0.5, "zombie_groan", 0.9), (c(4), "engine", 1.0), (c(4) + d4 * 0.34, "stampede", 1.0),
              (c(4) + d4 * 0.6, "heartbeat", 0.9), (c(5), "engine", 1.0), (c(5) + 0.8, "title_hit", 0.9)]
    S.music = [(0, "tension", 0.8), (c(1), "chase", 1.0), (c(3), "dread", 0.9), (c(4), "chase", 1.0),
               (c(5), "joy", 1.0)]
