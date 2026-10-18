"""День 30 (ночь): полночь, небо взрывается, десять тысяч голов поднимаются — и поворачиваются на музыку карусели в
дальнем конце парка. Бежишь во двор без костюма — впервые за 30 дней они чуют тебя. Полное пламя, шар рвётся вверх
и встаёт: трос, узел заело. Бандит перегрызает его за две секунды — месяц тренировалась. Ты летишь."""
from scenes.kit import *
from scenes.shared import *
from scenes.cold import balloon_rig, crew, grabber, court_bg, BX, GY, STAKE

FL = PK.FL
ROPE_TOP = (BX - 130, GY - 50)     # где трос крепится к корзине (как в «крючке»)


def shot_sky(ctx, t, S):
    """Полночь: небо взрывается над замком, кадр опускается на море лиц."""
    d = S.cue(1) - 0.1
    k = ease_io(clamp(t / d))
    off = lerp(-300, 40, k)
    D.vgrad(ctx, 0, 0, W, H, [(0, "#060a24"), (0.6, "#16296a"), (1, "#2c4a8c")])
    ctx.save()
    ctx.translate(0, -off * 0.3)
    SEA.stars(ctx, 0, -300, W, 900, t, 4, 1.4)
    LK.show(ctx, t + 0.3, -100, W + 100, -200, 900, 1.6, seed=300, period=1.2)
    ctx.restore()
    ctx.save()
    ctx.translate(0, -off)
    ctx.save()
    ctx.translate(W / 2, 860)
    ctx.scale(0.42, 0.42)
    CA.castle(ctx, 0, 0, 1.0, "night", t, lit=0.9)
    ctx.restore()
    heads_sea(ctx, t, -100, W + 100, 820, 1180, 110, 30, 34, 170, up=smooth(clamp(t / 1.2)), arms=0.3, glow=0.8)
    ctx.restore()
    fl = max(0.0, math.sin(t * 5.3)) ** 3
    fx.tint(ctx, hexrgb(["#ff4a6a", "#4ad8ff", "#ffd23a"][int(t * 1.6) % 3]), 0.12 * fl, cairo.OPERATOR_SCREEN)
    pop_text(ctx, "MIDNIGHT", W / 2, 190, t, 0.3, 120, "#ffd23a", dur=d, shake=False)


def shot_turn(ctx, t, S):
    """Головы вверх — потом в дальнем конце заиграла карусель: все головы поворачиваются туда и толпа уходит."""
    d = S.cue(2) - S.cue(1)
    L = S.cue(1, True) - S.cue(1)
    T_MUSIC = L * 0.4
    side = smooth(clamp((t - T_MUSIC - 0.4) / 0.6))
    D.vgrad(ctx, 0, 0, W, H, [(0, "#0a1238"), (1, "#1e2a5c")])
    LK.show(ctx, t + 4.0, -100, W + 100, -100, 500, 0.8, seed=301, period=1.4)
    if t < d * 0.62:
        heads_sea(ctx, t, -100, W + 100, 360, 1180, 120, seed=31, s0=40, s1=150, up=1.0 - side, arms=0.0, glow=0.7,
                  side=side)
    else:
        tt = t - d * 0.62
        cam = Cam(Keys((0, 1500), (d - d * 0.62, 2100)), FL - 400, 0.38, anchor=(1500, 520))
        sky_back(ctx, t, cam, "night", -4000, 9000)
        with layer(ctx, cam, t):
            PK.plaza(ctx, "night", -4000, 9000, c="#2a3a2a")
            RD.carousel(ctx, 5600, FL + 500, 1.0, t * 0.8, t, "night", run=1.0, music=1.0, lights=True)
            crowd_floor(ctx, tt, 302, 120, -3500, 4200, FL + 100, FL + 700, 100, 125, vx=(90, 140))
    if t > T_MUSIC:
        for j in range(5):
            ph = (t * 0.8 + j / 5) % 1
            RD.note(ctx, W - 80 - ph * 700, 420 + j * 60 - ph * 80, 1.4, PK.BRIGHT[j], 1 - ph, j % 2 == 0)
        pop_text(ctx, "OOM-PAH-PAH", W - 380, 260, t, T_MUSIC, 80, "#ffd23a", dur=d, shake=False)
    if t > T_MUSIC + 0.8:
        pop_text(ctx, "THEY TURN", W / 2 - 400, 200, t, T_MUSIC + 0.8, 90, "#9fc86a", dur=d, shake=False)


def shot_run(ctx, t, S):
    """Тео без костюма бежит к воротам замка; ближние зомби принюхиваются и разворачиваются за ним."""
    d = S.cue(3) - S.cue(2)
    T_SMELL = d * 0.45
    GATE_X = 4000
    w = Walk(Keys((0, 600), (d, GATE_X, "lin")), FL + 150, 112, "run", t1=d + 1)
    cam = Cam(lambda q: w.x(q) + 250, FL - 380, 0.62, shake=0.04)
    sky_back(ctx, t, cam, "night", -3000, 9000)
    with layer(ctx, cam, t):
        PK.plaza(ctx, "night", -3000, 9000, c="#2a3a2a")
        CA.castle(ctx, GATE_X + 300, FL - 40, 0.75, "night", t, lit=0.8, gate_open=1.0)
        x = w.x(t)
        r = rng(30)
        for i in range(14):
            zx = r.uniform(-200, GATE_X + 600)
            zy = FL + r.uniform(40, 320)
            near = abs(zx - x) < 700 and t > T_SMELL
            if near:
                q = R.gait(t * 1.6 + i, "shamble", "side", i)
                q.update(a1=(1.6, -0.2), a2=(1.4, -0.1), mouth=0.9)
                zx = zx + (t - T_SMELL) * 120 * (1 if x > zx else -1)
                f = 1 if x > zx else -1
            else:
                q = zombie_idle(t, i)
                q.update(hturn=0.0, neck=0.2)
                f = 1                          # смотрят направо — туда, где музыка
            fig = R.Fig(R.park_zombie(3100 + i))
            J = fig.draw(ctx, zx, zy, floor_s(zy, FL, 104), f, q)
            if near:
                nx, ny = fig.world(zx, zy, floor_s(zy, FL, 104), f, J["head"])
                sniff_lines(ctx, nx + f * 70, ny + 10, t, 0.9)
        THEO.draw(ctx, x, FL + 150, 112, 1, w.pose(t, dict(face="scared", sweat=1.0)))
        stink(ctx, x - 40, FL + 150 - 300, t, 1.0, 1.0, "#ff8a6a")
    if t > 0.3:
        pop_text(ctx, "NO COSTUME", W / 2 - 360, 220, t, 0.3, 90, "#fff6d8", dur=T_SMELL, shake=False)
    if t > T_SMELL:
        pop_text(ctx, "SNIFF", W / 2 + 360, 260, t, T_SMELL, 90, "#9fc86a", dur=d, shake=True)


def shot_stuck(ctx, t, S):
    """Полное пламя: шар рвётся вверх — и встаёт рывком. Трос. Узел заело. Зомби тянутся к корзине."""
    d = S.cue(4) - S.cue(3)
    T_JERK = d * 0.3
    T_KNOT = d * 0.55
    lift = 180 * smooth(clamp(t / T_JERK))
    jerk = 0.0 if t < T_JERK else 30 * math.exp(-(t - T_JERK) * 5) * math.sin((t - T_JERK) * 30)
    gy = GY - 10 - lift + jerk
    if t < T_KNOT:
        cam = Cam(BX + 40, -180, Keys((0, 0.44), (T_KNOT, 0.5)), shake=lambda q: 0.05 + shake_k(q, T_JERK, 0.4, 1.0))
        court_bg(ctx, t, cam)
        with layer(ctx, cam, t):
            balloon_rig(ctx, t, BX, gy, 1.0, burner=1.0, inside_fn=lambda c, x, rim, s: crew(c, x, rim, s, t, "scared"),
                        tether_to=STAKE, taut=1.0 if t > T_JERK else 0.4)
            for i in range(9):
                zx = BX + (-1 if i % 2 else 1) * (420 + (i // 2) * 210)
                p = zombie_reach(t, i)
                p.update(a1=(1.8, -0.3), a2=(1.6, -0.2), mouth=1.0)
                R.Fig(R.park_zombie(3000 + i)).draw(ctx, zx, GY + 10 + (i % 3) * 30, 112, 1 if zx < BX else -1, p)
        fx.darkness(ctx, 0.2, [fx.Light(*cam.to_screen(t, BX, GY - 900), 900, power=0.7, glow_a=0.0)])
        pop_text(ctx, "FULL FLAME", W / 2 - 380, 230, t, 0.1, 90, "#ffd23a", dur=T_JERK + 0.3, shake=True)
        if t > T_JERK:
            pop_text(ctx, "JERK!", W / 2 + 400, 300, t, T_JERK, 110, "#ff6a5a", dur=0.9)
        return
    tt = t - T_KNOT
    # крупно: Тео перегнулся через борт и дёргает узел у кольца — не поддаётся
    cam = Cam(BX - 220, GY - 250 - lift, Keys((0, 1.5), (d - T_KNOT, 1.65)), shake=lambda q: 0.15)
    court_bg(ctx, t, cam)
    with layer(ctx, cam, t):
        vib = math.sin(t * 70) * 4
        balloon_rig(ctx, t, BX, gy, 1.0, burner=1.0, inside_fn=lambda c, x, rim, s: crew(c, x, rim, s, t, "scream"),
                    tether_to=STAKE, vib=vib)
        kx, ky = ROPE_TOP[0], ROPE_TOP[1] - lift
        D.circle(ctx, kx, ky, 26, hexrgb("#c8a868"), D.INK, 4)
        D.circle(ctx, kx, ky, 46, None, hexrgb("#ff4a3a"), 6, alpha=0.6 + 0.4 * math.sin(t * 12))
    pop_text(ctx, "THE KNOT IS STUCK", W / 2, 200, tt, 0.1, 90, "#ff4a3a", dur=d, shake=True)


def shot_chew(ctx, t, S):
    """Бандит спускается по тросу и грызёт — две секунды, вставка «месяц тренировок»; трос лопается."""
    d = S.cue(5) - S.cue(4)
    T_CUT = min(d - 0.5, 2.6)
    lift = 180
    gy = GY - 10 - lift
    kx, ky = ROPE_TOP[0], ROPE_TOP[1] - lift
    u = 0.14                       # место на тросе, где грызёт
    cx, cy = lerp(kx, STAKE[0], u), lerp(ky, STAKE[1], u)
    cut_k = smooth(clamp((t - T_CUT) / 0.4))
    cam = Cam(cx + 120, cy - 80, 1.5, shake=lambda q: 0.12)
    court_bg(ctx, t, cam)
    with layer(ctx, cam, t):
        vib = 0.0 if t > T_CUT else math.sin(t * 70) * 3
        balloon_rig(ctx, t, BX, gy - 400 * cut_k, 1.0, burner=1.0,
                    inside_fn=lambda c, x, rim, s: crew(c, x, rim, s, t, "scream", bandit=False))
        BL.tether(ctx, kx, ky - 400 * cut_k + vib, STAKE[0], STAKE[1], 1.0, "night",
                  cut=(u, cut_k) if t > T_CUT else None)
        # Бандит на тросе (до разреза), потом — вцепился в обрывок и уезжает вверх
        if t < T_CUT:
            chew = math.sin(t * 22)
            draw_raccoon(ctx, cx + 10, cy + 40, 95, -1, raccoon_pose(t, "eat", chew=chew,
                                                                    hold=lambda c, x, y: None))
            for j in range(4):
                ph = (t * 3 + j / 4) % 1
                D.circle(ctx, cx - 10 + j * 8, cy + 10 + ph * 120, 4, hexrgb("#d8b878"), None, 0, alpha=1 - ph)
        else:
            draw_raccoon(ctx, cx, cy + 40 - 400 * cut_k, 95, -1, raccoon_pose(t, "climb"))
    # таймер «2 секунды»
    tm = min(2.0, t / T_CUT * 2.0)
    counter_badge(ctx, "CHEW", "%.1f s" % tm, W - 320, 160, "#ffd23a", 420)
    if t < T_CUT:
        pop_text(ctx, "CHOMP CHOMP", W / 2 - 360, 240, t, 0.2, 80, "#fff6d8", dur=T_CUT, shake=True)
        # вставка: месяц тренировок
        k = ease_out_back(clamp((t - 0.6) / 0.3)) * (1 - smooth(clamp((t - T_CUT + 0.3) / 0.3)))
        if k > 0:
            ctx.save()
            ctx.translate(380, 760)
            ctx.rotate(-0.05)
            ctx.scale(k, k)
            D.rect(ctx, -260, -170, 520, 340, hexrgb("#fbf6ea"), D.INK, 5, wob=0)
            ctx.save()
            ctx.rectangle(-236, -146, 472, 250)
            ctx.clip()
            D.vgrad(ctx, -236, -146, 472, 250, [(0, "#c8784a"), (1, "#8a6a4a")])

            def rope_end(c, x, y):
                D.line(c, x - 0.05, y + 0.02, x + 0.5, y + 0.12, D.INK, 0.075)
                D.line(c, x - 0.05, y + 0.02, x + 0.5, y + 0.12, hexrgb("#d8b878"), 0.05)
            draw_raccoon(ctx, 40, 80, 110, -1, raccoon_pose(t, "eat", chew=math.sin(t * 16), hold=rope_end))
            ctx.restore()
            D.text(ctx, "DAY 10... DAY 29", 0, 150, 40, D.FONT_HAND, hexrgb("#3a2a1a"))
            ctx.restore()
    else:
        pop_text(ctx, "SNAP!", W / 2, 260, t, T_CUT, 140, "#fff6d8", dur=1.2)


def shot_fly(ctx, t, S):
    """Шар выходит из двора над салютом; внизу тянутся руки. Потом — силуэт на фоне луны над озером."""
    d = S.dur - S.cue(5)
    T_WIDE = d * 0.6
    if t < T_WIDE:
        rise = 900 * ease_in(clamp(t / T_WIDE)) + 400
        cam = Cam(BX + 40, lambda q: -300 - 0.6 * (900 * ease_in(clamp(q / T_WIDE)) + 400), 0.4)
        court_bg(ctx, t, cam)
        with layer(ctx, cam, t):
            balloon_rig(ctx, t, BX, GY - 10 - rise, 1.0, burner=0.8,
                        inside_fn=lambda c, x, rim, s: crew(c, x, rim, s, t, "laugh"))
            for i in range(9):
                zx = BX + (-1 if i % 2 else 1) * (300 + (i // 2) * 200)
                p = zombie_reach(t, i)
                p.update(a1=(2.4, -0.2), a2=(2.2, -0.1), neck=-0.5, mouth=1.0)
                R.Fig(R.park_zombie(3000 + i)).draw(ctx, zx, GY + 10 + (i % 3) * 30, 112, 1 if zx < BX else -1, p)
        fx.darkness(ctx, 0.15)
        return
    tt = t - T_WIDE
    D.vgrad(ctx, 0, 0, W, H, [(0, "#060a24"), (0.65, "#1a2a64"), (1, "#2c4a8c")])
    SEA.stars(ctx, 0, 0, W, 700, t, 4, 1.4)
    D.circle(ctx, W / 2 + 200, 360, 260, hexrgb("#fff6d8"), None, 0)
    D.radial(ctx, W / 2 + 200, 360, 520, "#fff6d8", 0.25, 0)
    D.rect(ctx, 0, 800, W, H - 800, hexrgb("#101a3a"), None, 0, wob=0)
    for k in range(40):
        wx = (k * 131 + t * 20) % W
        D.line(ctx, wx, 830 + (k * 17) % 240, wx + 40, 830 + (k * 17) % 240, hexrgb("#4a6aa8"), 2, 0.6)
    LK.show(ctx, t + 6.0, -200, 500, 500, 820, 0.6, seed=303, period=1.6)
    # силуэт шара пересекает луну
    bx = lerp(W / 2 - 100, W / 2 + 500, tt / (d - T_WIDE))
    by = 420 - 40 * tt
    ctx.save()
    ctx.translate(bx, by)
    ctx.scale(0.16, 0.16)
    e = BL.envelope(ctx, 0, -(300 + 420) * 1.0, 0.85, 1.0, "deepnight", t=t)
    BL.basket(ctx, 0, 0, 1.0, "deepnight", 0.6, t, cables_to=(e["left"][0], e["left"][1], e["right"][0], e["right"][1]))
    ctx.restore()
    LK.lighthouse(ctx, W - 220, 805, 0.1, "night", beam=1.0 if (t % 1.2) < 0.3 else 0.0, ang=3.0, t=t)


def build(S):
    c = S.cue
    S.shots = [
        Shot(0, shot_sky, "fade", 0.4),
        Shot(c(1) - 0.1, shot_turn, "fade", 0.25),
        Shot(c(2) - 0.1, shot_run, "whip", 0.25),
        Shot(c(3) - 0.1, shot_stuck, "fade", 0.2),
        Shot(c(4) - 0.1, shot_chew, "fade", 0.2),
        Shot(c(5) - 0.1, shot_fly, "white", 0.15),
    ]
    S.tods = [(0, "night")]
    d3 = c(4) - c(3)
    t_cut = c(4) - 0.1 + min(c(5) - c(4) - 0.5, 2.6)
    S.sfx += [(0.1, "firework", 1.0), (0.8, "firework", 0.9), (1.7, "firework", 1.0), (c(1) + (c(1, True) - c(1)) * 0.4,
                                                                                         "carousel", 1.0),
              (c(2), "running", 0.9), (c(2) + (c(3) - c(2)) * 0.45, "sniff", 0.9), (c(3), "burner", 1.0),
              (c(3) + d3 * 0.3, "rope_creak", 1.0), (c(4), "chomp", 1.0), (c(4) + 1.0, "chomp", 0.9),
              (t_cut, "snap", 1.0), (c(5), "burner", 0.8), (c(5) + 0.5, "firework", 0.7)]
    S.music = [(0, "tension", 1.0), (c(1) + (c(1, True) - c(1)) * 0.4, "carnival", 0.8), (c(2), "chase", 1.0),
               (c(5) - 0.1, "happy_end", 1.0)]
