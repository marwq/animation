"""День 9 (ночь): плохие новости от Гаса. Компьютер парка живёт по летнему расписанию: на 30-й день в полночь он
сам запустит самый большой салют в штате. Все зомби на 50 миль услышат и придут по мосту. «Уйду раньше». —
«Малыш, с острова теперь один путь. Вверх»."""
from scenes.kit import *
from scenes.shared import *

COMP_X = 3600 - 700          # компьютер салюта в пультовой (control_room x1 = 3600)


def shot_badnews(ctx, t, S):
    """Разрезанный экран: Тео в башне слушает — Гас на маяке, хмурый."""
    d = S.cue(1) - 0.1
    camL = Cam(IN.TOWER_CRATE_X + 720, 520, 1.15)
    camR = Cam(IN.GUS_RADIO_X - 820, 520, Keys((0, 1.0), (d, 1.08)))
    k = smooth(clamp((t - 0.2) / 0.5))
    diag_split(ctx, lambda c: theo_radio(c, t, camL, 0.0, "neutral", "night", fig=THEO_FUR),
               lambda c: gus_radio(c, t, camR, 1.0, "worried", "night"), k)
    speech(ctx, 1450, 230, "BAD NEWS, KID.", t, 0.6, 66, tail=(-1, 1))


def crt(ctx, t, draw, label):
    """Экран компьютера во весь кадр: тёмное стекло, скруглённая рамка, строки развёртки."""
    D.rect(ctx, 0, 0, W, H, hexrgb("#5a606c"), None, 0, wob=0)
    D.rrect(ctx, 90, 70, W - 180, H - 140, 60, hexrgb("#0e1410"), D.INK, 10)
    ctx.save()
    D.rrect_path(ctx, 120, 100, W - 240, H - 200, 50)
    ctx.clip()
    draw(ctx)
    for y in range(100, H - 100, 6):
        D.line(ctx, 120, y, W - 120, y, hexrgb("#000000"), 2, 0.25)
    D.radial(ctx, W / 2, H / 2, W * 0.6, "#4cff8a", 0.06, 0)
    ctx.restore()
    D.text(ctx, label, W / 2, H - 30, 34, D.FONT_TITLE, hexrgb("#fbfaf6"))


def shot_schedule(ctx, t, S):
    """Пультовая: наезд на компьютер SHOWTIME 3000 — расписание; потом его экран: превью финала, «AUTO»."""
    d = S.cue(2) - S.cue(1)
    T_SCREEN = d * 0.45
    left = 21 * 86400 + 4 * 3600 - t           # полночь в конце 30-го дня
    if t < T_SCREEN:
        cam = Cam(Keys((0, 1700), (T_SCREEN, COMP_X - 150, "io")), Keys((0, 420), (T_SCREEN, 330, "io")),
                  Keys((0, 0.62), (T_SCREEN, 1.3, "io")))
        room_back(ctx, t, cam, "control_night_live_%d" % int(t),
                  lambda c: IN.control_room(c, "night", countdown=left, t=int(t)), (-600, -900, 4200, 2700), 0.7)
        with layer(ctx, cam, t):
            p = R.stand("back", t, 1)
            p.update(h2=(0.3, -1.6), h1=(-0.2, -1.7))
            THEO_FUR.draw(ctx, COMP_X - 450, IN.FL + 60, 112, 1, p)
            draw_raccoon(ctx, COMP_X - 820, IN.FL + 80, 105, 1, raccoon_pose(t, "sit", look=0.5))
        fx.darkness(ctx, 0.35, [fx.Light(*cam.to_screen(t, COMP_X, 250), 700, power=0.6, glow_a=0.0)])
        return
    tt = t - T_SCREEN

    def screen(c):
        D.vgrad(c, 120, 100, W - 240, H - 200, [(0, "#060a1a"), (1, "#141a3a")])
        # силуэт замка и финал салюта на превью
        c.save()
        c.translate(W / 2, 900)
        c.scale(0.32, 0.32)
        CA.castle(c, 0, 0, 1.0, "deepnight", 0.0, lit=0.0)
        c.restore()
        LK.show(c, tt + 3.0, 300, W - 300, 160, 860, 1.0, seed=4, period=1.2)
        D.text(c, "DAY 30 · MIDNIGHT", W / 2, 200, 70, D.FONT_TITLE, hexrgb("#4cff8a"))
        D.text(c, "GRAND FINALE", W / 2, 280, 54, D.FONT_TITLE, hexrgb("#ffd23a"))
        if tt > 0.8 and int(tt * 2.5) % 2 == 0:
            D.rrect(c, W / 2 + 330, 690, 330, 110, 18, hexrgb("#e8423c"), None, 0)
            D.text(c, "AUTO", W / 2 + 495, 775, 80, D.FONT_TITLE, hexrgb("#fbfaf6"))
    crt(ctx, tt, screen, "SHOWTIME 3000 · SUMMER SCHEDULE")
    if tt > 1.0:
        pop_text(ctx, "BY ITSELF.", 420, 640, tt, 1.0, 90, "#fff6d8", dur=d, shake=False)


def shot_horde(ctx, t, S):
    """Карта ночью: звуковые кольца от парка — 50 миль; орда по мосту — все."""
    d = S.cue(3) - S.cue(2)
    T_HORDE = d * 0.35
    D.rect(ctx, 0, 0, W, H, hexrgb("#0e1430"), None, 0, wob=0)
    s = lerp(0.17, 0.2, smooth(clamp(t / d)))
    cx, cy = W / 2 + 250, H / 2 + 20
    LK.island_map(ctx, cx, cy, s, "dusk", t, labels=True, horde=smooth(clamp((t - T_HORDE) / (d - T_HORDE))) * 0.9,
                  sky_ride=False)
    # звуковые волны от замка
    px, py = cx + LK.MAP["castle"][0] * s, cy + LK.MAP["castle"][1] * s
    for k in range(5):
        ph = (t * 0.5 + k / 5) % 1
        D.circle(ctx, px, py, 80 + ph * 1500, None, hexrgb("#ffd23a"), 10 * (1 - ph) + 2, alpha=0.9 * (1 - ph))
    D.circle(ctx, px, py, 40, hexrgb("#ffd23a"), D.INK, 4)
    D.text(ctx, "BOOM", px, py - 60, 50, D.FONT_TITLE, hexrgb("#ffd23a"), stroke=D.INK, slw=6)
    fx.darkness(ctx, 0.15)
    if t > 0.5:
        pop_text(ctx, "50 MILES", W - 330, 200, t, 0.5, 90, "#ffd23a", dur=d, shake=False)
    if t > T_HORDE:
        counter_badge(ctx, "COMING:", "ALL", 330, 200, "#7ee04a", 440)
        x0 = cx - 4300 * s
        ph = (t * 1.3) % 1
        for k in range(3):
            ax = x0 + ((ph + k / 3) % 1) * 2600 * s
            D.poly(ctx, [(ax, cy + 300 * s - 40), (ax + 60, cy + 300 * s), (ax, cy + 300 * s + 40)],
                   hexrgb("#e8423c"), D.INK, 3, wob=0)


def shot_up(ctx, t, S):
    """«Уйду раньше». — «Малыш, с острова один путь…» — камера по башне замка вверх, в звёзды: ВВЕРХ."""
    d = S.dur - S.cue(3)
    T_GUS, T_SKY = d * 0.3, d * 0.62
    if t < T_GUS:
        cam = Cam(IN.TOWER_CRATE_X + 600, 520, Keys((0, 1.15), (T_GUS, 1.22)))
        theo_radio(ctx, t, cam, 1.0, "worried", "night", fig=THEO_FUR)
        speech(ctx, 1300, 230, "THEN I'LL LEAVE BEFORE THAT.", t, 0.2, 54, tail=(-1, 1))
        return
    if t < T_SKY:
        cam = Cam(IN.GUS_RADIO_X - 820, 520, Keys((0, 1.05), (T_SKY - T_GUS, 1.18)))
        gus_radio(ctx, t, cam, 1.0, "neutral", "night")
        speech(ctx, 1300, 230, "KID... THERE'S ONLY ONE WAY\nOFF THAT ISLAND NOW.", t, T_GUS + 0.2, 54, tail=(-1, 1))
        return
    tt = t - T_SKY
    dd = d - T_SKY
    cam = Cam(0, Keys((0, PK.FL - 700), (dd * 0.7, -1700, "io"), (dd, -1750)), Keys((0, 0.55), (dd, 0.5)),
              anchor=(0, 520))
    sky_back(ctx, t, cam, "night", -4000, 4000, moon=(500, -500, 90))
    with layer(ctx, cam, t):
        PK.plaza(ctx, "night", -4000, 4000, c="#3a5a3a")
        CA.castle(ctx, 0, PK.FL, 0.9, "night", t, lit=0.9)
    if tt > dd * 0.55:
        pop_text(ctx, "UP.", W / 2, H / 2 + 40, tt, dd * 0.55, 260, "#fff6d8", dur=dd, shake=False, rot=0.0)


def build(S):
    c = S.cue
    S.shots = [
        Shot(0, shot_badnews, "fade", 0.4),
        Shot(c(1) - 0.1, shot_schedule, "fade", 0.3),
        Shot(c(2) - 0.1, shot_horde, "fade", 0.3),
        Shot(c(3) - 0.1, shot_up, "fade", 0.3),
    ]
    S.tods = [(0, "night")]
    S.sfx += [(0.2, "radio_beep", 0.8), (c(1) + 0.3, "click", 0.5), (c(1) + (c(2) - c(1)) * 0.45, "firework", 0.6),
              (c(2) + 0.2, "boom", 0.7), (c(2) + 1.2, "crowd_groan", 0.8), (c(3) + 0.2, "radio_beep", 0.6),
              (S.dur - 2.0, "wind", 0.6)]
    S.music = [(0, "tension", 0.8), (c(2), "chase", 0.7), (c(3), "mystery", 0.7), (S.dur - 3.0, "wonder", 0.9)]
