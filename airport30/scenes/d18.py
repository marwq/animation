"""День 18: Пиклз пропала. Поиски везде. Нашлась в бюро находок: десять тысяч вещей, за которыми никто
не вернулся — плюшевые мишки, гитара, свадебное платье, каноэ. Спит на горе мягких игрушек. Рядом —
два пилотских наушника в коробке. Хорошая собака."""
from scenes.kit import *
from scenes.shared import *


def missing_poster(ctx, t, k):
    ctx.save()
    ctx.translate(W / 2, H / 2 - 20)
    ctx.rotate(-0.04)
    ctx.scale(k, k)
    D.rect(ctx, -380, -360, 760, 720, hexrgb("#fbf6ee"), D.INK, 6, wob=0)
    D.text(ctx, "MISSING", 0, -250, 110, D.FONT_TITLE, hexrgb("#e8423c"))
    D.rect(ctx, -250, -200, 500, 330, hexrgb("#9fd8ec"), D.INK, 4, wob=0)
    draw_lab(ctx, 30, 110, 210, -1, dog_pose(t, "sit", wag=0.5))
    D.text(ctx, "PICKLES", 0, 220, 80, D.FONT_TITLE, hexrgb("#1c3f7c"))
    D.text(ctx, "GOOD GIRL · K-9", 0, 300, 44, D.FONT_TITLE, hexrgb("#6a6a6a"))
    ctx.restore()


def shot_gone(ctx, t, S):
    d = S.cue(1) - 0.1
    D.vgrad(ctx, 0, 0, W, H, [(0, "#2a2448"), (1, "#141030")])
    missing_poster(ctx, t, ease_out_back(clamp(t / 0.4)))


def shot_search(ctx, t, S):
    d = S.cue(2) - S.cue(1)
    seg = d / 3
    i = min(2, int(t / seg))
    tt = t - i * seg
    if i == 0:
        cam = Cam(1200, 400, 0.7)
        term_back(ctx, tt, cam, "day", 1.0, "A")
    elif i == 1:
        cam = Cam(1900, 560, 1.0)
        room_back(ctx, tt, cam, "tunnel_on", lambda c: RM.tunnel(c, 1.0), (-1400, -500, 7400, 2400), 0.7)
    else:
        cam = Cam(1200, 600, 1.1)
        room_back(ctx, tt, cam, "diner", lambda c: TM.diner(c), (-600, -1500, 4000, 3300))
    with layer(ctx, cam, tt):
        y = (TM.FL + 60) if i != 1 else RM.FL
        p = R.gait(tt * 3.2, "run", "side", 1)
        p.update(face="worried", mouth=0.6 + 0.3 * math.sin(tt * 8), h1=(0.4, -3.2))
        x = cam.x(0) - 500 + tt * 380
        DANNY_JACKET.draw(ctx, x, y, 115, 1, p)
    pop_text(ctx, "PICKLES?!", W / 2 + 300, 260, tt, 0.2, 100, "#fff6d8", dur=seg)
    D.rect(ctx, 80, 110, 300, 100, hexrgb("#0e1410"), D.INK, 5, wob=0)
    D.text(ctx, ["GATES", "TUNNELS", "DINER"][i], 230, 180, 54, D.FONT_TITLE, hexrgb("#ff4a3a"))
    k = clamp((tt - seg * 0.5) / 0.2)
    if k > 0:
        D.line(ctx, 90, 120, 370, 200, hexrgb("#e8423c"), 10)


def shot_lf(ctx, t, S):
    d = S.cue(3) - S.cue(2)
    cam = Cam(Keys((0, 600), (d, 2700)), 380, Keys((0, 0.75), (d, 0.85)))
    room_back(ctx, t, cam, "lost", lambda c: RM.lost_found(c), (-600, -1500, 4600, 3300))
    with layer(ctx, cam, t):
        w = Walk(Keys((0, 200), (d, 2600, "lin")), RM.FL + 40, 115, "walk", t1=d + 2)
        w.draw(ctx, DANNY_JACKET, t, {"face": "shock", "hturn": 0.0, "view": "side"})
    for i, (txt, t0) in enumerate((("TEDDY BEARS", 0.3), ("A GUITAR", 1.3), ("A WEDDING DRESS", 2.3),
                                   ("A CANOE", 3.4))):
        pop_text(ctx, txt, 420 + (i % 2) * 1000, 230 + (i // 2) * 110, t, t0, 64, "#ffe36a", dur=d, shake=False)
    counter_badge(ctx, "ITEMS", "10,000", W - 340, H - 330, "#fff6d8", 560)


def shot_asleep(ctx, t, S):
    d = S.cue(4) - S.cue(3)
    cam = Cam(1400, 720, Keys((0, 1.5), (d, 1.8)))
    room_back(ctx, t, cam, "lost", lambda c: RM.lost_found(c), (-600, -1500, 4600, 3300))
    with layer(ctx, cam, t):
        r = rng(18)
        for k in range(40):
            x = 1400 + r.uniform(-340, 340)
            y = RM.FL + 20 - r.uniform(0, 200) * (1 - abs(x - 1400) / 360)
            c = hexrgb(r.choice(["#b8864a", "#f08cb0", "#7fd0ff", "#f2c230", "#9a6ad0", "#3fbf6a"]))
            D.circle(ctx, x, y, 34, c, D.INK, 3)
            D.circle(ctx, x - 20, y - 26, 12, c, D.INK, 3)
            D.circle(ctx, x + 20, y - 26, 12, c, D.INK, 3)
            D.circle(ctx, x - 10, y - 4, 4, D.INK, None, 0)
            D.circle(ctx, x + 10, y - 4, 4, D.INK, None, 0)
        draw_lab(ctx, 1420, RM.FL - 170, 100, 1, dog_pose(t, "lie", wag=0.0))
    for k in range(3):
        pop_text(ctx, "z", 1200 + k * 60, 380 - k * 60, t, 0.4 + k * 0.5, 60 + k * 14, "#fff6d8", dur=1.4, shake=False)


def shot_headsets(ctx, t, S):
    d = S.dur - S.cue(4)
    cam = Cam(1650, 680, 1.8)
    room_back(ctx, t, cam, "lost", lambda c: RM.lost_found(c), (-600, -1500, 4600, 3300))
    with layer(ctx, cam, t):
        D.rect(ctx, 1550, RM.FL - 180, 340, 160, hexrgb("#c9a46a"), D.INK, 5, wob=0)
        D.rect(ctx, 1550, RM.FL - 200, 340, 30, hexrgb("#b8925a"), D.INK, 4, wob=0)
        D.text(ctx, "PILOT HEADSETS x2", 1720, RM.FL - 90, 30, D.FONT_TITLE, hexrgb("#1c3f7c"))
        for k in range(2):
            headset_on(ctx, 1640 + k * 160, RM.FL - 250, 1.1)
        draw_lab(ctx, 1350, RM.FL, 105, 1, dog_pose(t, "sit", wag=1.0))
    fx.glow(ctx, W / 2 + 120, H / 2 - 60, 260, "#ffe36a", 0.3)
    pop_text(ctx, "GOOD DOG.", W / 2, 230, t, d * 0.4, 120, "#ffe36a", dur=d, shake=False)


def build(S):
    c = S.cue
    S.shots = [
        Shot(0, shot_gone, "fade", 0.3),
        Shot(c(1) - 0.1, shot_search, "whip", 0.25),
        Shot(c(2) - 0.1, shot_lf, "fade", 0.3),
        Shot(c(3) - 0.1, shot_asleep, "fade", 0.25),
        Shot(c(4) - 0.1, shot_headsets, "whip", 0.25),
    ]
    S.sfx += [(c(1), "footsteps", 0.8), (c(3) + 0.4, "snore", 0.6), (c(4) + 0.5, "shimmer", 0.9)]
    S.music = [(0, "tension", 0.7), (c(3), "warm", 1.0)]
