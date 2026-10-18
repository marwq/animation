"""День 7: неделя жизни — отель. Лаунж первого класса: массажные кресла, душ с шестью видами мыла,
бесплатные закуски. Пиклз спит на кожаном диване дороже твоей машины. Куртка пилота почти впору.
Лучший отель Среднего Запада, без гостей."""
from scenes.kit import *
from scenes.shared import *


def lounge_bg(ctx, t, cam, tod="day"):
    room_back(ctx, t, cam, "lounge_%s" % tod, lambda c: (TM.lounge(c, tod), TM.sofa(c, 1500, TM.FL + 60)),
              (-600, -1500, 4600, 3300))


def shot_week(ctx, t, S):
    d = S.cue(1) - 0.1
    cam = Cam(Keys((0, 600), (d, 700)), 520, Keys((0, 0.9), (d, 1.0)))
    lounge_bg(ctx, t, cam)
    with layer(ctx, cam, t):
        w = Walk(Keys((0, -200), (d, 500, "lin")), TM.FL + 60, 115, "walk", t1=d + 2)
        w.draw(ctx, DANNY, t, {"face": "happy"})
        draw_lab(ctx, w.x(t) - 220, TM.FL + 60, 105, 1, dog_pose(t, "trot", phase=t * 2.2))
    for k in range(10):
        ph = (t * 0.8 + k / 10) % 1
        r = rng(k)
        fx.glow(ctx, r.uniform(100, W - 100), r.uniform(100, 800), 30, "#ffe36a", 0.6 * (1 - ph))
    pop_text(ctx, "1 WEEK ALIVE!", W / 2, 230, t, 0.2, 110, "#ffe36a", dur=d)


def shot_montage(ctx, t, S):
    d = S.cue(2) - S.cue(1)
    seg = d / 3
    i = min(2, int(t / seg))
    tt = t - i * seg
    if i == 0:
        cam = Cam(3120, 640, 1.6)
        lounge_bg(ctx, tt, cam)
        with layer(ctx, cam, tt):
            p = sit_pose(tt, 1, "laugh")
            vib = math.sin(tt * 60) * 0.03
            p.update(hip=(vib, p["hip"][1]), hturn=0.7, mouth=0.6, h1=(0.4, -1.2))
            DANNY.draw(ctx, 3500 + math.sin(tt * 60) * 4, TM.FL - 30, 115, -1, p)
        pop_text(ctx, "BRRRRR", W / 2 + 300, 300, tt, 0.1, 100, "#fff6d8", rot=0.05, dur=seg)
    elif i == 1:
        D.vgrad(ctx, 0, 0, W, H, [(0, "#9fd8ec"), (1, "#5ab8f0")])
        for k in range(6):
            x = 260 + k * 280
            kk = ease_out_back(clamp((tt - k * 0.15) / 0.3))
            ctx.save()
            ctx.translate(x, 620)
            ctx.scale(kk, kk)
            D.rrect(ctx, -70, -160, 140, 220, 30, hexrgb(["#f08cb0", "#7fd0ff", "#f2c230", "#3fbf6a", "#9a6ad0",
                                                          "#ff9a3c"][k]), D.INK, 5)
            D.rect(ctx, -24, -200, 48, 44, hexrgb("#fbfaf6"), D.INK, 4, wob=0)
            ctx.restore()
        for k in range(20):
            r = rng(k + 3)
            ph = (tt * 0.6 + r.random()) % 1
            D.circle(ctx, r.uniform(0, W), H - ph * H, r.uniform(10, 30), hexrgb("#ffffff"), D.INK, 2,
                     alpha=0.8 * (1 - ph))
        pop_text(ctx, "x6 SOAP", W / 2, 200, tt, 0.1, 110, "#1c3f7c", dur=seg, shake=False)
    else:
        cam = Cam(700, 600, 1.6)
        lounge_bg(ctx, tt, cam)
        with layer(ctx, cam, tt):
            p = R.stand("side", tt, 1)
            p.update(face="eat", cheeks=1.0, h1=(0.6, -3.0 + 0.3 * math.sin(tt * 8)))
            DANNY.draw(ctx, 700, TM.FL + 60, 115, -1, p)
        pop_text(ctx, "FREE!", W / 2 + 300, 260, tt, 0.1, 140, "#ffe36a", dur=seg)


def shot_sofa(ctx, t, S):
    d = S.cue(3) - S.cue(2)
    cam = Cam(1760, 760, Keys((0, 1.7), (d, 1.9)))
    lounge_bg(ctx, t, cam)
    with layer(ctx, cam, t):
        draw_lab(ctx, 1760, TM.FL - 70, 110, 1, dog_pose(t, "lie", wag=0.0))
    for k in range(3):
        pop_text(ctx, "z", 1100 + k * 60, 400 - k * 60, t, 0.4 + k * 0.5, 60 + k * 14, "#fff6d8", dur=1.4, shake=False)
    k = ease_out_back(clamp((t - d * 0.3) / 0.3))
    if k > 0:
        ctx.save()
        ctx.translate(W - 420, 260)
        ctx.rotate(0.08)
        ctx.scale(k, k)
        D.poly(ctx, [(-200, -70), (160, -70), (220, 0), (160, 70), (-200, 70)], hexrgb("#fbfaf6"), D.INK, 5, wob=0)
        D.circle(ctx, 150, 0, 12, None, D.INK, 4)
        D.text(ctx, "$12,000", -30, 22, 64, D.FONT_TITLE, hexrgb("#e8423c"))
        ctx.restore()
    k2 = ease_out_back(clamp((t - d * 0.6) / 0.3))
    if k2 > 0:
        ctx.save()
        ctx.translate(380, 300)
        ctx.scale(k2, k2)
        D.rrect(ctx, -230, -80, 460, 160, 24, hexrgb("#15181f"), D.INK, 5)
        D.text(ctx, "YOUR CAR: $900", 0, 18, 46, D.FONT_TITLE, hexrgb("#9aa3ac"))
        ctx.restore()


def shot_jacket(ctx, t, S):
    d = S.cue(4) - S.cue(3)
    T_ON = d * 0.4
    cam = Cam(1250, 560, 1.4)
    room_back(ctx, t, cam, "lockers", lambda c: RM.lockers(c), (-600, -1500, 4000, 3300))
    with layer(ctx, cam, t):
        fig = DANNY_JACKET if t > T_ON else DANNY
        p = R.stand("front", t, 1)
        p.update(face="happy" if t > T_ON else "shock", a1=(0.4, 0.3), a2=(0.4, 0.3))
        fig.draw(ctx, 1250, RM.FL, 118, 1, p)
        if t < T_ON:
            D.rect(ctx, 1460, 360, 150, 420, hexrgb("#3a4a6a"), D.INK, 4, wob=0)
            D.rect(ctx, 1480, 420, 110, 300, hexrgb("#8a5a34"), D.INK, 3, wob=0)
    if t > T_ON:
        pop_text(ctx, "ALMOST FITS", W / 2, 220, t, T_ON, 100, "#ffe36a", dur=d, shake=False)
        fx.glow(ctx, W / 2 - 40, 560, 60, "#ffe36a", 0.8)


def shot_hotel(ctx, t, S):
    d = S.dur - S.cue(4)
    cam = Cam(Keys((0, 1500), (d, 1600)), 560, Keys((0, 0.95), (d, 1.05)))
    lounge_bg(ctx, t, cam, "dusk")
    with layer(ctx, cam, t):
        p = sit_pose(t, 1, "smile", seat=0.75)
        p.update(hturn=0.7, h1=(0.4, -1.0))
        DANNY_JACKET.draw(ctx, 1640, TM.FL + 20, 115, 1, p)
        draw_lab(ctx, 1900, TM.FL - 70, 100, 1, dog_pose(t, "lie", wag=0.4))
    k = ease_out_back(clamp((t - 0.4) / 0.35))
    if k > 0:
        ctx.save()
        ctx.translate(W / 2, 220)
        ctx.scale(k, k)
        D.rrect(ctx, -380, -90, 760, 180, 30, hexrgb("#fff6d8"), D.INK, 6)
        for i in range(5):
            star(ctx, -240 + i * 120, 0, 50)
        ctx.restore()
    pop_text(ctx, "GUESTS: 0", W / 2, 400, t, 1.0, 70, "#fff6d8", dur=d, shake=False)


def build(S):
    c = S.cue
    S.shots = [
        Shot(0, shot_week),
        Shot(c(1) - 0.1, shot_montage, "whip", 0.25),
        Shot(c(2) - 0.1, shot_sofa, "fade", 0.3),
        Shot(c(3) - 0.1, shot_jacket, "whip", 0.25),
        Shot(c(4) - 0.1, shot_hotel, "fade", 0.3),
    ]
    S.tods = [(0, "day"), (c(4), "dusk")]
    S.sfx += [(0.2, "party_horn", 0.8), (c(1) + 0.1, "massage", 0.8), (c(2) + 0.4, "snore", 0.7),
              (c(3) + (c(4) - c(3)) * 0.4, "ding", 0.9)]
    S.music = "party"
