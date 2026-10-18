"""День 28: полночь. Они поднимаются по борту мостика, друг у друга на плечах. Рука хватает за
щиколотку — пинок — отпускает. Хватаешь Анкор и рацию, вверх, через люк на крышу. За спиной они
заливают мостик: рация, батарея, кнопка гудка — всё потеряно. Ползёшь по тросу к трубе под дождём."""
from scenes.kit import *
from scenes.shared import *
from scenes.cold import wing_scene, pyramid, bolt, bolt_line, PYR_X
from scenes.d24 import storm_fx

LVL = (R.HIP_H + R.TORSO + 0.2) * 100


def shot_climb_up(ctx, t, S):
    """Снизу вдоль борта: колонны зомби лезут по балконам, камера поднимается к крылу."""
    d = S.cue(1) - 0.1
    height = Keys((0, 1500), (d, 560, "out"))(t)
    cam = Cam(Keys((0, 1650), (d, 1520)), Keys((0, 1350), (d, 420)), Keys((0, 0.95), (d, 0.85)), shake=0.2)
    wing_scene(ctx, t, cam, height, face="scared", flash=bolt(t, (0.5, 3.1)))
    D.rrect(ctx, W - 420, 120, 300, 110, 16, hexrgb("#0e1410"), D.INK, 5)
    D.text(ctx, "00:00", W - 270, 200, 72, D.FONT_TITLE, hexrgb("#ff4a3a"))


def falling_zombie(ctx, t, t0, x, y):
    k = t - t0
    if k < 0:
        return
    ctx.save()
    ctx.translate(x + k * 120, y + 900 * k * k)
    ctx.rotate(k * 4)
    p = R.stand("side", t, 3)
    p.update(a1=(2.8, 0.3), a2=(2.4, 0.4), k1=(0.8, 0.6), mouth=1.0)
    R.Fig(R.zombie_look(900)).draw(ctx, 0, 0, 100, -1, p)
    ctx.restore()


def shot_kick(ctx, t, S):
    tg, tr = 0.35, 1.5
    height = 300 + LVL * smooth(clamp((t - tr) / 0.2))
    cam = Cam(Keys((0, 1520), (tr, 1560), (tr + 0.6, 1600)), Keys((0, 300), (tr + 0.6, 380)),
              Keys((0, 1.35), (tg + 0.1, 1.55, "out"), (tr + 0.6, 1.25)),
              shake=lambda tt: 0.35 + shake_k(tt, tg, 0.5, 1.0) + shake_k(tt, tr, 0.5, 1.2))
    wing_scene(ctx, t, cam, height, grab=tg, release=tr, face="scream", flash=bolt(t, (1.5,)))
    with layer(ctx, cam, t):
        falling_zombie(ctx, t, tr, PYR_X - 20, OD.WING_Y - 30)
    if t > tg:
        pop_text(ctx, "GRAB!", 560, 260, t, tg, 120, "#9fc86a", dur=1.0)
    if t > tr - 0.1:
        pop_text(ctx, "KICK!", 1350, 300, t, tr - 0.1, 160, "#ffe36a", dur=1.2)
        impact(ctx, *cam.to_screen(t, PYR_X - 40, OD.WING_Y - 30), clamp((t - tr + 0.1) / 0.3), 140, "#ffffff")
    if t > tr + 0.9:
        x, y = cam.to_screen(t, PYR_X + 80, OD.WING_Y + 500)
        pop_text(ctx, "aaaa...", x, y, t, tr + 0.9, 60, "#9fc86a", dur=1.5, shake=False)


def shot_hatch(ctx, t, S):
    """Мостик: хватаешь рацию Макса, кошка на плечо, вверх по трапу в люк."""
    d = S.cue(3) - S.cue(2)
    T_GRAB, T_LAD = 0.9, 1.8
    cam = Cam(Keys((0, 2380), (T_LAD, 2300), (d, 2420)), Keys((0, 560), (T_LAD, 500), (d, 260)),
              Keys((0, 1.05), (d, 1.2)), shake=0.12)
    bridge_back(ctx, t, cam, "deepnight", 0.0, moon=None, battery=4, autopilot=False, hatch_open=1.0)
    with layer(ctx, cam, t):
        # руки в иллюминаторе двери на крыло
        for i in range(3):
            a = t * 6 + i * 2
            D.circle(ctx, BR.WING_X - 20 + i * 20 + math.sin(a) * 10, 420 + math.cos(a) * 12, 13,
                     hexrgb(R.ZOMBIE_SKIN[1]), D.INK, 3)
        s = 115
        if t < T_LAD:
            x = Keys((0, 2700), (T_GRAB, BR.RADIO_X + 60, "out"), (T_LAD, BR.HATCH_X - 20))(t)
            p = R.run_pose(t, 1) if hasattr(R, "run_pose") else R.stand("side", t, 1)
            f = -1 if t < T_GRAB + 0.2 else 1
            p.update(face="scared", h1=(0.7, -2.3) if t < T_GRAB else (0.45, -1.9))
            J = LEO_CAP.draw(ctx, x, BR.BF + 40, s, f, p)
            if t > T_GRAB:
                hx, hy = LEO_CAP.world(x, BR.BF + 40, s, f, J["hand1"])
                IN.walkie(ctx, hx, hy - 20, 0.7, 0.2)
                cx, cy = LEO_CAP.world(x, BR.BF + 40, s, f, J["sh2"])
                k = clamp((t - T_GRAB - 0.2) / 0.35)
                draw_cat(ctx, lerp(BR.RADIO_X + 220, cx, k), lerp(690, cy - 10, k) - math.sin(k * math.pi) * 120,
                         70, -f, cat_pose(t, "jump" if k < 1 else "held", vest=True))
            else:
                IN.walkie(ctx, BR.RADIO_X + 20, 690, 0.7, 0.0)
                draw_cat(ctx, BR.RADIO_X + 220, 690, 70, -1, cat_pose(t, "hiss", vest=True))
        else:
            prog = (t - T_LAD) * 3.2
            J = draw_climber(ctx, LEO_CAP, BR.HATCH_X, BR.BF + 40, s, prog, 1, "back", "scared")
            base = BR.BF + 40 - prog * s * LEO_CAP.look.scale
            cx, cy = LEO_CAP.world(BR.HATCH_X, base, s, 1, J["top"])
            draw_cat(ctx, cx + 10, cy + 20, 70, 1, cat_pose(t, "held", vest=True))
    storm_fx(ctx, t, 0.0, (0.3, 2.6))
    if t > T_GRAB:
        pop_text(ctx, "WALKIE", 560, 230, t, T_GRAB, 70, "#f2c230", dur=1.4, shake=False)
    if t > T_GRAB + 0.5:
        pop_text(ctx, "CAT", 560, 320, t, T_GRAB + 0.5, 70, "#f2782e", dur=1.2, shake=False)
    if t > T_LAD + 0.5:
        pop_text(ctx, "UP!", 1400, 260, t, T_LAD + 0.5, 140, "#fff6d8", dur=2.0)


LOST = [("RADIO", "#4cff8a"), ("BATTERY", "#ff4a3a"), ("HORN BUTTON", "#ffe36a")]


def shot_pour(ctx, t, S):
    d = S.cue(4) - S.cue(3)
    T_DOOR = 0.4
    cam = Cam(Keys((0, 1900), (d, 1700)), 520, Keys((0, 0.82), (d, 0.9)), shake=lambda tt: shake_k(tt, T_DOOR, 0.6, 1.2))
    bridge_back(ctx, t, cam, "deepnight", 0.0, battery=4 if t < d * 0.5 else 0, autopilot=False, hatch_open=1.0)
    with layer(ctx, cam, t):
        # дверь на крыло распахнута
        if t > T_DOOR:
            D.rect(ctx, BR.WING_X - 110, 300, 220, 560, hexrgb("#0a0f24"), D.INK, 4, wob=0)
            ctx.save()
            ctx.translate(BR.WING_X + 110, 300)
            ctx.scale(-0.3, 1)
            D.rect(ctx, 0, 0, 220, 560, hexrgb("#9aa4b8"), D.INK, 4, wob=0)
            ctx.restore()
        # поток зомби из двери налево
        r = rng(28)
        for i in range(26):
            t0 = T_DOOR + i * 0.16
            if t < t0:
                continue
            tt = t - t0
            sp = r.uniform(380, 560)
            x = BR.WING_X - tt * sp
            gy = BR.BF + 40 + r.uniform(-30, 40)
            if x < -300:
                continue
            p = zombie_reach(t, i)
            ph = tt * sp / 95.0
            p.update(f1=(0.25 * math.sin(ph * 2.2), 0.0), f2=(-0.25 * math.sin(ph * 2.2), 0.0))
            R.Fig(R.zombie_look(4000 + i, r.choice([None, "officer", "hawaiian", "chef"]))).draw(
                ctx, x, gy, 100 + r.uniform(-6, 6), -1, p)
        # ноги Лео исчезают в люке
        if t < 1.0:
            prog = 6.0 + t * 3
            draw_climber(ctx, LEO_CAP, BR.HATCH_X, BR.BF + 40, 115, prog, 1, "back", "scared")
        # искры с пульта
        if t > d * 0.45:
            for k in range(6):
                a = t * 17 + k
                fx.glow(ctx, BR.RADIO_X - 60 + math.cos(a) * 50, 560 + math.sin(a * 1.3) * 40, 26, "#ffe36a", 0.8)
    if t < 1.0:
        # люк сверху закрывает часть кадра — потолок
        pass
    storm_fx(ctx, t, 0.0, (0.4, 3.0))
    if t > T_DOOR:
        pop_text(ctx, "CRASH!", 1500, 300, t, T_DOOR, 140, "#fff6d8", dur=1.0)
    # список потерь
    for i, (txt, c) in enumerate(LOST):
        t0 = d * (0.32 + i * 0.16)
        if t < t0:
            continue
        k = ease_out_back(clamp((t - t0) / 0.3))
        x, y = 320, 250 + i * 120
        ctx.save()
        ctx.translate(x, y)
        ctx.scale(k, k)
        D.rrect(ctx, -60, -50, 540, 100, 20, hexrgb("#fff6d8"), D.INK, 6)
        D.text(ctx, txt, 200, 22, 58, D.FONT_TITLE, hexrgb(c), stroke=D.INK, slw=6)
        kx = clamp((t - t0 - 0.35) / 0.2)
        if kx > 0:
            D.line(ctx, -40, -35, -40 + 520 * kx, 35, hexrgb("#e8423c"), 14)
        ctx.restore()
    if t > d * 0.86:
        pop_text(ctx, "GONE.", 1400, 700, t, d * 0.86, 140, "#e8423c", dur=3, shake=False)


def cable_pt(u):
    return lerp(-200, 3300, u), lerp(700, -260, u) + math.sin(u * math.pi) * 140


def shot_cable(ctx, t, S):
    d = S.dur - S.cue(4)
    T_CLOSE = 1.8
    if t < T_CLOSE:
        # общий план: трос от крыши мостика к трубе, крошечная фигурка
        sc = 0.6
        a = (-825 * sc, 900 - 630 * sc)
        b = (-180 * -sc, 900 - 830 * sc)
        cam = Cam(Keys((0, -230), (T_CLOSE, -260)), Keys((0, 520), (T_CLOSE, 480)), Keys((0, 1.25), (T_CLOSE, 1.45)),
                  shake=0.2)
        sea_back(ctx, t, cam, "deepnight", hy=900, rough=1.0, p=0.3, clouds=False)
        with layer(ctx, cam, t, 0.3):
            SEA.cloudbank(ctx, -3000, 4000, 200, "storm", seed=28, n=12, s0=1.4, s1=2.2)
            bolt_line(ctx, 600, -700, 500, 9, bolt(t, (0.3,)))
        ship_ext(ctx, t, cam, 0, 900, sc, "deepnight", 0.0, f=-1, wake=0.0, smoke=False, antenna=False)
        with layer(ctx, cam, t):
            D.line(ctx, a[0], a[1], b[0], b[1], D.INK, 7)
            D.line(ctx, a[0], a[1], b[0], b[1], hexrgb("#9fb0d0"), 3)
            u = 0.12 + 0.18 * t / T_CLOSE
            px, py = lerp(a[0], b[0], u), lerp(a[1], b[1], u)
            p = hang_pose(t, 0.0, "determined")
            LEO_CAP.draw(ctx, px, py + 3.75 * 12, 12, 1, p)
        x, y = cam.to_screen(t, px, py + 30)
        D.circle(ctx, x, y, 70, None, hexrgb("#ffe36a"), 6)
        D.text(ctx, "YOU", x, y - 95, 60, D.FONT_TITLE, hexrgb("#ffe36a"), stroke=D.INK, slw=6)
        bx, by = cam.to_screen(t, *b)
        D.text(ctx, "FUNNEL", bx + 40, by - 60, 50, D.FONT_TITLE, hexrgb("#cfe0ff"), stroke=D.INK, slw=6)
        storm_fx(ctx, t, 1.4, (0.3,))
        return
    tt = t - T_CLOSE
    dd = d - T_CLOSE
    u = 0.25 + 0.6 * tt / max(1.0, dd)
    sway = math.sin(t * 2.4) * 0.12
    x, y = cable_pt(u)
    s = 105
    cam = Cam(lambda q: cable_pt(0.25 + 0.6 * q / max(1.0, dd))[0] + 100,
              lambda q: cable_pt(0.25 + 0.6 * q / max(1.0, dd))[1] + 230, 1.0, shake=0.3)
    sea_back(ctx, tt, cam, "deepnight", hy=2300, rough=1.0, p=0.15, clouds=False)
    with layer(ctx, cam, tt, 0.4):
        SEA.cloudbank(ctx, -3000, 6000, 100, "storm", seed=29, n=14, s0=1.4, s1=2.2)
        bolt_line(ctx, x + 900, -1300, 0, 13, bolt(tt, (1.2, 3.4)))
    with layer(ctx, cam, tt, 0.7):
        # далеко внизу — палуба и светящиеся глаза
        D.rect(ctx, -3000, 880, 9000, 2000, hexrgb("#141a30"), D.INK, 4, wob=0)
        r = rng(281)
        for i in range(40):
            ex, ey = r.uniform(-2000, 5000), r.uniform(930, 1060)
            zombie_glow_eyes(ctx, ex + math.sin(tt + i) * 8, ey, 9, 0.6 + 0.4 * math.sin(tt * 3 + i))
    with layer(ctx, cam, tt):
        # крыша мостика слева, труба справа
        D.rect(ctx, -1400, 700, 1300, 900, hexrgb("#4a5470"), D.INK, 5, wob=0)
        D.rect(ctx, -1400, 680, 1300, 30, hexrgb("#5a6478"), D.INK, 4, wob=0)
        D.poly(ctx, [(3200, -500), (4200, -560), (4300, 1600), (3100, 1600)], hexrgb("#9aa6c0"), D.INK, 6, wob=0)
        D.poly(ctx, [(3196, -420), (4204, -476), (4214, -300), (3190, -250)], hexrgb("#1c2a4a"), None, 0, wob=0)
        D.poly(ctx, [(3180, -280), (4240, -330), (4250, -180), (3170, -130)], hexrgb("#1c2a4a"), None, 0, wob=0)
        D.poly(ctx, [(3170, -120), (4250, -170), (4252, -140), (3168, -92)], hexrgb("#8a7438"), None, 0, wob=0)
        pts = [cable_pt(k / 60) for k in range(61)]
        D.polyline(ctx, pts, D.INK, 9)
        D.polyline(ctx, pts, hexrgb("#6a7488"), 4)
        # вис на руках, перехват
        hw = math.sin(t * 5)
        p = hang_pose(t, swing=sway, face="determined")
        p.update(h1=(0.25 * hw, -3.75), h2=(-0.25 * hw, -3.72), blink=0)
        J = LEO_CAP.draw(ctx, x, y + 3.75 * s - 6, s, 1, p)
        cx, cy = LEO_CAP.world(x, y + 3.75 * s - 6, s, 1, J["top"])
        draw_cat(ctx, cx + 30, cy + 70, 72, 1, cat_pose(t, "held", vest=True))
        hx, hy = LEO_CAP.world(x, y + 3.75 * s - 6, s, 1, J["hip"])
        IN.walkie(ctx, hx - 20, hy + 10, 0.45, 0.3)
    storm_fx(ctx, tt, 1.5, (1.2, 3.4))
    if tt > dd * 0.55:
        pop_text(ctx, "DON'T LET GO.", W / 2, 220, tt, dd * 0.55, 100, "#fff6d8", dur=4, shake=False)


def build(S):
    c = S.cue
    S.shots = [
        Shot(0, shot_climb_up),
        Shot(c(1) - 0.1, shot_kick),
        Shot(c(2) - 0.1, shot_hatch, "whip", 0.25),
        Shot(c(3) - 0.1, shot_pour),
        Shot(c(4) - 0.1, shot_cable, "black", 0.3),
    ]
    S.tods = [(0, "deepnight")]
    S.sfx += [(0.5, "thunder", 1.0), (c(1) + 0.35, "grab", 1.0), (c(1) + 1.5, "punch", 1.0),
              (c(1) + 1.6, "scream", 0.7), (c(3) + 0.4, "door_crash", 1.0), (c(3) + 0.6, "zombie_groan", 1.0),
              (c(4) + 0.3, "thunder", 0.9)]
    S.music = "chase"
