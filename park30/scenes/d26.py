"""День 26: у замка одни ворота, а к салюту в парке будет десять тысяч. Правило два ещё раз: все динамики дальней части
парка — карусель, автодром, парад — на таймер в полночь. Самая громкая вечеринка на острове. И тебя там не будет."""
from scenes.kit import *
from scenes.shared import *
from scenes.d20 import parade_float

FL = PK.FL


def timer_tag(ctx, x, y, s=1.0):
    D.rrect(ctx, x - 110 * s, y - 50 * s, 220 * s, 100 * s, 18 * s, hexrgb("#0e1410"), D.INK, 5)
    D.text(ctx, "00:00", x, y + 22 * s, 64 * s, D.FONT_TITLE, hexrgb("#ff3a2a"))


def shot_gate(ctx, t, S):
    """Замок: одни ворота — кольцо вокруг. Карта: десять тысяч точек сходятся к парку."""
    d = S.cue(1) - 0.1
    T_MAP = d * 0.45
    if t < T_MAP:
        cam = Cam(0, FL - 700, Keys((0, 0.42), (T_MAP, 0.5)), anchor=(0, 520))
        sky_back(ctx, t, cam, "day", -5000, 5000, sun=(1800, -1400, 120))
        with layer(ctx, cam, t):
            PK.plaza(ctx, "day", -5000, 5000, c="#a8d878")
            CA.castle(ctx, 0, FL, 0.9, "day", t, gate_open=0.0)
        gx, gy = cam.to_screen(t, 0, FL - 330)
        k = smooth(clamp((t - 0.4) / 0.4))
        D.circle(ctx, gx, gy, 260 * k + 1, None, hexrgb("#ff3a2a"), 10)
        if t > 0.6:
            pop_text(ctx, "ONE GATE", W / 2 + 400, 260, t, 0.6, 100, "#ff6a5a", dur=d, shake=False)
        return
    tt = t - T_MAP
    D.rect(ctx, 0, 0, W, H, hexrgb("#0e1430"), None, 0, wob=0)
    LK.island_map(ctx, W / 2 + 160, H / 2 + 20, 0.2, "dusk", t, labels=False, horde=0.3 + 0.7 * smooth(clamp(tt / 1.5)),
                  sky_ride=False)
    n = int(10000 * smooth(clamp(tt / 1.6)))
    counter_badge(ctx, "ZOMBIES", "{:,}".format(n), W - 380, 160, "#9fc86a", 600)


def panel_carousel(ctx, t):
    cam = Cam(1500, FL - 200, 0.42)
    grass_back(ctx, t, cam, "day", -3000, 7000)
    with layer(ctx, cam, t):
        RD.carousel(ctx, 1500, FL + 500, 1.0, 0.3, t, "day", run=0.0, music=0.0, lights=False)


def panel_bumper(ctx, t):
    cam = Cam(1500, FL - 200, 0.55)
    grass_back(ctx, t, cam, "day", -3000, 7000)
    with layer(ctx, cam, t):
        D.rect(ctx, 400, FL - 900, 2200, 60, hexrgb("#2b2f3a"), D.INK, 4, wob=0)
        D.rect(ctx, 400, FL - 60, 2200, 160, hexrgb("#8f99a3"), D.INK, 4, wob=0)
        for k in range(4):
            D.line(ctx, 450 + k * 700, FL - 900, 450 + k * 700, FL + 40, D.INK, 14)
        for k, c in enumerate(("#e8423c", "#2f8fd8", "#ffd23a", "#3fbf6a")):
            RD.bumper_car(ctx, 700 + k * 480, FL + 40, 1.0, c, 1 if k % 2 else -1, "day", t=t)
        D.rrect(ctx, 1100, FL - 1120, 800, 160, 26, hexrgb("#e8423c"), D.INK, 5)
        D.text(ctx, "BUMPER CARS", 1500, FL - 1015, 80, D.FONT_TITLE, hexrgb("#fbfaf6"))


def panel_parade(ctx, t):
    cam = Cam(1500, FL - 300, 0.6)
    street_back(ctx, t, cam, "day", -1400, 6000, shut=True)
    with layer(ctx, cam, t):
        parade_float(ctx, 1500, FL + 120, "cake", t, "day", music=False)


def shot_wire(ctx, t, S):
    """Раскал прикручивает таймер к щитку; провода к динамикам; потом: карусель, автодром, парад — 00:00."""
    d = S.cue(2) - S.cue(1)
    T_TRI = d * 0.32
    if t < T_TRI:
        cam = Cam(1300, FL - 380, 1.1)
        street_back(ctx, t, cam, "day", -1400, 6000, shut=True)
        with layer(ctx, cam, t):
            D.rect(ctx, 1300, FL - 520, 300, 420, hexrgb("#5a606c"), D.INK, 5, wob=0)
            timer_tag(ctx, 1450, FL - 420, 1.0)
            for k, c in enumerate(("#e8423c", "#ffd23a", "#2f8fd8")):
                D.curve(ctx, [(1350 + k * 90, FL - 100), (1300 + k * 120, FL + 40), (2400, FL + 60 + k * 20)],
                        hexrgb(c), 8)
            p = R.stand("side", t, 1)
            tw = math.sin(t * 9) * 0.06
            p.update(h1=(0.95 + tw, -2.95), h2=(0.85, -2.6), lean=0.1)
            RASCAL_PATCH.draw(ctx, 1150, FL + 60, 112, 1, rascal_pose(p, "calm"))
            speakers(ctx, t, [cam.to_screen(t, 2300, FL - 420)], 0.0)
        pop_text(ctx, "RULE #2. AGAIN.", W / 2, 200, t, 0.2, 80, "#ffd23a", dur=T_TRI, shake=False)
        return
    tt = t - T_TRI
    D.rect(ctx, 0, 0, W, H, hexrgb("#1c1830"), None, 0, wob=0)
    panels = (panel_carousel, panel_bumper, panel_parade)
    labels = ("CAROUSEL", "BUMPER CARS", "PARADE")
    pw = W / 3
    for i, fn in enumerate(panels):
        t0 = i * (d - T_TRI) * 0.25
        k = clamp((tt - t0) / 0.35)
        if k <= 0:
            continue
        off = (1 - ease_out(k)) * H
        ctx.save()
        ctx.rectangle(i * pw + 6, 6 + off, pw - 12, H - 12)
        ctx.clip()
        ctx.translate(i * pw + pw / 2 - W / 2, off)
        fn(ctx, t)
        ctx.restore()
        timer_tag(ctx, i * pw + pw / 2, 180 + off, 1.0)
        D.rrect(ctx, i * pw + pw / 2 - 190, H - 170 + off, 380, 90, 20, hexrgb("#0e1410"), D.INK, 5)
        D.text(ctx, labels[i], i * pw + pw / 2, H - 103 + off, 52, D.FONT_TITLE, hexrgb("#ffd23a"))


def shot_party(ctx, t, S):
    """Как это будет: дальний конец парка гремит музыкой, толпа пляшет у карусели. Тео в окне башни — один."""
    d = S.dur - S.cue(2)
    L = S.cue(2, True) - S.cue(2)
    T_TOWER = L * 0.55
    if t < T_TOWER:
        cam = Cam(1500, FL - 400, 0.36, anchor=(1500, 520))
        grass_back(ctx, t, cam, "night", -3000, 7000)
        with layer(ctx, cam, t):
            RD.carousel(ctx, 1500, FL + 500, 1.0, t * 0.8, t, "night", run=1.0, music=1.0, lights=True)

            def pose(m, tt_):
                q = zombie_idle(tt_, m.seed % 97)
                q.update(lean=0.15 * math.sin(tt_ * 6 + m.seed), a1=(1.2, -2.2 - 0.5 * math.sin(tt_ * 6 + m.seed)),
                         a2=(1.0, -2.0))
                return q
            crowd_floor(ctx, t, 261, 80, -1500, 4500, FL + 300, FL + 900, 100, 125, pose_fn=pose)
        for j in range(6):
            ph = (t * 0.7 + j / 6) % 1
            RD.note(ctx, 200 + j * 300 + ph * 80, 600 - ph * 400, 1.4, PK.BRIGHT[j], 1 - ph, j % 2 == 0)
        fx.darkness(ctx, 0.25, [fx.Light(W / 2, 420, 900, power=0.6, glow_a=0.2)])
        pop_text(ctx, "THE LOUDEST PARTY", W / 2, 200, t, 0.2, 90, "#ffd23a", dur=T_TOWER, shake=True)
        return
    tt = t - T_TOWER

    def view(c, x, y, w, h):
        D.vgrad(c, x, y, w, h, [(0, "#0a1238"), (1, "#1c2a5c")])
        for j in range(5):         # далёкие огни дальней части парка
            gx = x + 60 + j * 90
            D.circle(c, gx, y + h * 0.66, 10, hexrgb(PK.BRIGHT[(j + int(t * 4)) % 8]), None, 0)
            D.radial(c, gx, y + h * 0.66, 50, PK.BRIGHT[j], 0.4, 0)
        for j in range(3):
            ph = (t * 0.6 + j / 3) % 1
            RD.note(c, x + 120 + j * 120, y + h * 0.6 - ph * 160, 0.5, "#ffd23a", 1 - ph, j % 2 == 0)
    cam = Cam(IN.TOWER_WIN_X, 400, Keys((T_TOWER, 1.05), (d, 1.2)))
    room_back(ctx, t, cam, "tower_party_%d" % (int(t * 4) % 8), lambda c: IN.tower_room(c, "night", view=view),
              (-600, -900, 4200, 2700), 0.7)
    with layer(ctx, cam, t):
        p = R.stand("back", t, 1)
        p.update(h1=(-0.3, -1.7), h2=(0.3, -1.7))
        THEO_FUR_PATCH.draw(ctx, IN.TOWER_WIN_X, IN.FL + 60, 112, 1, p)
    fx.darkness(ctx, 0.35, [fx.Light(*cam.to_screen(t, IN.TOWER_WIN_X, 250), 600, power=0.5, glow_a=0.0)])
    if tt > 0.4:
        pop_text(ctx, "...WITHOUT YOU", W / 2 + 380, 240, tt, 0.4, 80, "#fff6d8", dur=d, shake=False)


def build(S):
    c = S.cue
    S.shots = [
        Shot(0, shot_gate, "fade", 0.4),
        Shot(c(1) - 0.1, shot_wire, "fade", 0.3),
        Shot(c(2) - 0.1, shot_party, "fade", 0.3),
    ]
    S.tods = [(0, "day"), (c(2), "night")]
    S.sfx += [(0.6, "stamp", 0.6), (c(1) + 0.2, "drill", 0.7), (c(1) + 1.5, "click", 0.6), (c(2), "carousel", 0.9),
              (c(2) + 0.3, "crowd_happy", 0.0)]
    S.music = [(0, "tension", 0.7), (c(1), "fun", 0.8), (c(2), "carnival", 1.0),
               (c(2) + (S.cue(2, True) - c(2)) * 0.55, "lonely", 0.8)]
