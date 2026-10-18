"""День 6: рации операторов работают. Перебираешь каналы. На девятом отвечают: «Это Гас». 74 года, построил
«Тандерболт» в 1979-м и тридцать лет поднимал аэростат парка. Живёт на маяке за озером. «Помаши». Машешь —
вдали мигает огонёк."""
from scenes.kit import *
from scenes.shared import *


def radio_close(ctx, t, ch, static=1.0, talk=0.0):
    """Крупно: рация в лапе-перчатке, каналы, помехи."""
    D.vgrad(ctx, 0, 0, W, H, [(0, "#1a1e3a"), (1, "#0e1020")])
    ctx.save()
    ctx.translate(W / 2 - 80, H / 2 + 330)
    ctx.scale(3.2, 3.2)
    IN.radio(ctx, 0, 0, 1.0, True, "night", ch, t, talk)
    ctx.restore()
    # лапа костюма: серый мех снизу, белая перчатка обхватывает корпус рации
    cx, cy = W / 2 - 80, H / 2 + 300
    D.poly(ctx, [(cx - 230, H + 20), (cx - 190, cy + 60), (cx + 190, cy + 60), (cx + 250, H + 20)],
           hexrgb("#9a9ea6"), D.INK, 6, wob=0)
    for k in range(4):
        D.rrect(ctx, cx - 175 + k * 6, cy - 150 + k * 62, 120, 58, 28, hexrgb("#fbfaf6"), D.INK, 5)
    D.rrect(ctx, cx - 210, cy - 40, 420, 120, 50, hexrgb("#fbfaf6"), D.INK, 6)
    D.rrect(ctx, cx + 120, cy - 170, 70, 150, 34, hexrgb("#fbfaf6"), D.INK, 5)
    if static > 0:
        r = rng(int(t * 20))
        for k in range(12):
            x = W / 2 + 280 + r.uniform(-60, 260)
            y = 300 + r.uniform(-120, 300)
            D.polyline(ctx, [(x, y), (x + 20, y - 18), (x + 40, y + 10), (x + 60, y - 12)], hexrgb("#9fb0d0"), 4,
                       0.7 * static)
        pop_text(ctx, "KSSSHHH", W / 2 + 420, 200, t, int(t / 0.5) * 0.5, 70, "#9fb0d0", dur=0.45, shake=True)


def shot_channels(ctx, t, S):
    d = S.cue(1) - 0.1
    T_CLOSE = d * 0.35
    if t < T_CLOSE:
        cam = Cam(IN.TOWER_CRATE_X + 500, 520, Keys((0, 1.0), (T_CLOSE, 1.15)))
        theo_radio(ctx, t, cam, 0.0, "neutral", "night", fig=THEO_FUR)
        fx.darkness(ctx, 0.35, [fx.Light(W / 2, H / 2, 800, power=0.6, glow_a=0.0)])
        return
    ch = 1 + min(8, int((t - T_CLOSE) / ((d - T_CLOSE) / 8)))
    radio_close(ctx, t, ch, 1.0)


def shot_gus(ctx, t, S):
    """Канал 9: голос. Разрезанный экран: Тео в башне — Гас на маяке."""
    d = S.cue(2) - S.cue(1)
    camL = Cam(IN.TOWER_CRATE_X + 720, 520, 1.15)
    camR = Cam(IN.GUS_RADIO_X - 820, 520, 1.0)
    k = smooth(clamp((t - 0.2) / 0.5))
    diag_split(ctx, lambda c: theo_radio(c, t, camL, 0.0, "shock", "night", fig=THEO_FUR),
               lambda c: gus_radio(c, t, camR, 1.0, "smile", "night"), k)
    D.rrect(ctx, 60, 180, 230, 90, 18, hexrgb("#9fe870"), D.INK, 5)
    D.text(ctx, "CH 9", 175, 246, 60, D.FONT_TITLE, hexrgb("#1c3a1c"))
    speech(ctx, 1450, 230, "THIS IS GUS.", t, 0.6, 70, tail=(-1, 1))


def photo(ctx, x, y, w, h, rot, k, draw, caption):
    if k <= 0:
        return
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(rot)
    ctx.scale(k, k)
    D.rect(ctx, -w / 2, -h / 2, w, h, hexrgb("#fbf6ea"), D.INK, 5, wob=0)
    ctx.save()
    ctx.rectangle(-w / 2 + 24, -h / 2 + 24, w - 48, h - 130)
    ctx.clip()
    draw(ctx, -w / 2 + 24, -h / 2 + 24, w - 48, h - 130)
    D.rect(ctx, -w / 2, -h / 2, w, h, hexrgb("#c89a5a"), None, 0, wob=0, alpha=0.18)      # сепия
    ctx.restore()
    D.text(ctx, caption, 0, h / 2 - 40, 46, D.FONT_HAND, hexrgb("#3a2a1a"))
    D.rect(ctx, -60, -h / 2 - 20, 120, 40, hexrgb("#e8e0c0"), None, 0, wob=0, alpha=0.85)
    ctx.restore()


def shot_bio(ctx, t, S):
    """Фото на пробковой доске: 1979 — молодой Гас строит «Тандерболт»; 30 лет — аэростат."""
    d = S.cue(3) - S.cue(2)
    D.rect(ctx, 0, 0, W, H, hexrgb("#c8925a"), None, 0, wob=0)
    r = rng(2)
    for k in range(260):
        D.circle(ctx, r.uniform(0, W), r.uniform(0, H), r.uniform(2, 5), hexrgb("#a8723a"), None, 0, alpha=0.5)
    young = R.Look(**{**R.GUS.__dict__, "name": "gus79", "beard_col": "#8a5a34", "hair_col": "#8a5a34",
                      "hat": "hardhat", "hat_col": "#ffd23a", "details": ("glasses",)})

    def coaster(c, x, y, w, h):
        D.vgrad(c, x, y, w, h, [(0, "#8fc8e8"), (1, "#e8f0f4")])
        c.save()
        c.translate(x + w * 0.1, y + h * 0.95)
        c.scale(0.16, 0.16)
        tr = RD.Track(RD.thunderbolt_track(0, 0, 2600))
        RD.coaster_track(c, tr, 0, "day")
        c.restore()
        p = R.stand("side", 0, 3)
        p.update(face="laugh", h1=(0.7, -3.4))
        R.Fig(young).draw(c, x + w * 0.75, y + h * 0.95, 70, -1, p)

    def balloon(c, x, y, w, h):
        D.vgrad(c, x, y, w, h, [(0, "#8fc8e8"), (1, "#e8f0f4")])
        c.save()
        c.translate(x + w * 0.5, y + h * 0.7)
        c.scale(0.22, 0.22)
        e = BL.envelope(c, 0, -880, 0.85, 1.0, "day", t=0.0)
        BL.basket(c, 0, 0, 1.0, "day", 0.6, 0.0, cables_to=(e["left"][0], e["left"][1], e["right"][0], e["right"][1]))
        BL.tether(c, -130, -40, -500, 400, 0.9, "day")
        c.restore()

    k1 = ease_out_back(clamp((t - 0.2) / 0.35))
    k2 = ease_out_back(clamp((t - d * 0.5) / 0.35))
    photo(ctx, W / 2 - 430, H / 2 - 20, 720, 600, -0.06, k1, coaster, "1979 · THUNDERBOLT")
    photo(ctx, W / 2 + 430, H / 2 + 10, 720, 600, 0.05, k2, balloon, "30 YEARS · SKY BALLOON")
    if t > 0.4:
        pop_text(ctx, "AGE 74", W - 260, 170, t, 0.4, 110, "#fff6d8", dur=d, shake=False)


def shot_wave(ctx, t, S):
    """У окна башни: «Помаши» — машешь, вдали мигает маяк."""
    d = S.dur - S.cue(3)
    T_WAVE, T_BLINK = d * 0.35, d * 0.6
    blink = 1.0 if (t > T_BLINK and (t - T_BLINK) % 0.6 < 0.3) else 0.0
    cam = Cam(IN.TOWER_WIN_X + 80, 430, Keys((0, 1.08), (d, 1.22)))
    room_back(ctx, t, cam, "tower_night_%d" % int(blink), lambda c: IN.tower_room(c, "night", beam=blink),
              (-600, -900, 4200, 2700), 0.7)
    with layer(ctx, cam, t):
        p = R.stand("back", t, 1)
        wv = math.sin(t * 9) if t > T_WAVE else 0.0
        p.update(h2=(0.9 + 0.15 * wv, -3.45) if t > T_WAVE else (0.3, -1.6), h1=(-0.3, -1.7))
        THEO_FUR.draw(ctx, IN.TOWER_WIN_X - 60, IN.FL + 60, 112, 1, p)
        draw_raccoon(ctx, IN.TOWER_WIN_X + 200, 580, 95, -1, raccoon_pose(t, "sit", look=-0.6))
    fx.darkness(ctx, 0.3, [fx.Light(*cam.to_screen(t, IN.TOWER_WIN_X, 200), 600, power=0.5, glow_a=0.0)])
    speech(ctx, 520, 200, "WAVE.", t, 0.2, 70, tail=(1, 1), dur=T_WAVE + 0.8)
    if t > T_BLINK:
        pop_text(ctx, "BLINK", W / 2 + 420, 240, t, T_BLINK, 80, "#fff2a0", dur=d, shake=False)


def build(S):
    c = S.cue
    S.shots = [
        Shot(0, shot_channels, "fade", 0.4),
        Shot(c(1) - 0.1, shot_gus, "fade", 0.25),
        Shot(c(2) - 0.1, shot_bio, "fade", 0.3),
        Shot(c(3) - 0.1, shot_wave, "fade", 0.3),
    ]
    S.tods = [(0, "night")]
    S.sfx += [(0.3, "static", 0.8), (c(0) + 1.2, "click", 0.6), (c(1), "radio_beep", 0.9), (c(2) + 0.2, "pop", 0.6),
              (c(2) + (c(3) - c(2)) * 0.5, "pop", 0.6), (c(3) + 0.3, "crickets", 0.6)]
    S.music = [(0, "mystery", 0.8), (c(1), "warm", 0.8), (c(3), "hope", 0.8)]
