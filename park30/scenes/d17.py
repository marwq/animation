"""День 17 (ночь): на вершине колеса обозрения видно всё: забитый мост, город, полный ими, и озеро — четыре мили
воды. На том берегу маяк трижды мигает. Вот сколько лететь."""
from scenes.kit import *
from scenes.shared import *

FL = PK.FL
WX, WR = 1500, 1300
WCY = FL - WR - 300
LADDER_X = WX - 150
TOP_Y = WCY - WR + 60 + 6          # крыша верхней кабинки (кабинка висит на штанге 60 px)
HZ = 560                           # горизонт панорамы
LH_X = 5300                        # маяк на том берегу в панораме


def ladder(ctx, x, y0, y1, w=90):
    for k in (-1, 1):
        D.line(ctx, x + k * w / 2, y0, x + k * w / 2, y1, D.INK, 12)
        D.line(ctx, x + k * w / 2, y0, x + k * w / 2, y1, hexrgb("#8f99a3"), 6)
    y = y0 - RUNG * 112
    while y > y1:
        D.line(ctx, x - w / 2, y, x + w / 2, y, D.INK, 9)
        D.line(ctx, x - w / 2, y, x + w / 2, y, hexrgb("#8f99a3"), 4)
        y -= RUNG * 112


def wheel(ctx, t, gondola=None):
    RD.big_wheel(ctx, WX, WCY, WR, -math.pi / 2, "night", lights=False, gondola=gondola, t=t, gy=FL)


def roof_sitters(ctx, t, x, y, s=1.0, look=0.0):
    """Раскал сидит на крыше кабинки (вид сзади-сбоку), Бандит рядом."""
    p = R.stand("back", t, 1)
    p.update(hip=(0, R.HIP_H - 0.1), f1=(-0.3, -0.1), f2=(0.3, -0.1), h1=(-0.5, -1.4), h2=(0.5, -1.4))
    RASCAL_PATCH.draw(ctx, x, y + 0.6 * 112 * s, 112 * s, 1, rascal_pose(p, "calm"))
    draw_raccoon(ctx, x + 170 * s, y, 90 * s, 1, raccoon_pose(t, "sit", look=look))


def shot_climb(ctx, t, S):
    """По служебной лестнице вдоль опоры — наверх; внизу тянут руки. Потом общий план: крошечный силуэт наверху."""
    d = S.cue(1) - 0.1
    T_WIDE = d * 0.62
    if t < T_WIDE:
        prog = (FL - (WCY + 120)) / 112 * smooth(clamp(t / T_WIDE))
        cy = FL - prog * 112 - 200
        cam = Cam(LADDER_X + 250, lambda q: FL - (FL - (WCY + 120)) * smooth(clamp(q / T_WIDE)) - 200 + 80,
                  Keys((0, 0.75), (T_WIDE, 0.55)), anchor=(LADDER_X, 520))
        sky_back(ctx, t, cam, "night", -3000, 6000, moon=(2400, -300, 110))
        with layer(ctx, cam, t):
            PK.plaza(ctx, "night", -3000, 6000)
            wheel(ctx, t)
            ladder(ctx, LADDER_X, FL, WCY + 120)
            draw_climber(ctx, RASCAL_PATCH, LADDER_X, FL, 112, prog, 1, "back")
            for i, dx in enumerate((-560, -380, 330, 500, 680)):
                q = zombie_reach(t, i)
                q.update(a1=(2.4, -0.2), a2=(2.2, -0.1), neck=-0.4)
                R.Fig(R.park_zombie(1700 + i)).draw(ctx, LADDER_X + dx, FL + 40 + (i % 2) * 30, 106,
                                                    1 if dx < 0 else -1, q)
        fx.darkness(ctx, 0.25)
        return
    tt = t - T_WIDE
    cam = Cam(WX + 200, WCY - 300, Keys((0, 0.3), (d - T_WIDE, 0.33)), anchor=(WX, 520))
    sky_back(ctx, t, cam, "night", -4000, 7000, moon=(2600, -900, 140))
    with layer(ctx, cam, t):
        PK.plaza(ctx, "night", -4000, 7000)
        wheel(ctx, t)
        roof_sitters(ctx, t, WX - 40, TOP_Y, 1.0)
    fx.darkness(ctx, 0.2)
    pop_text(ctx, "THE HIGHEST POINT", W / 2, 200, tt, 0.2, 80, "#fff6d8", dur=d, shake=False)


def panorama(ctx, t, cam, beam=0.0):
    """Вид с колеса: слева мост в заторе, за ним город, справа — четыре мили озера и маяк."""
    with layer(ctx, cam, t, 0.2):
        PK.sky(ctx, t, "night", -2000, 9000, hz=HZ, moon=(3600, -200, 120), clouds=False)
    with layer(ctx, cam, t):
        LK.water(ctx, t, -2000, 9000, HZ, HZ + 1400, "night", glitter=0.6)
        # дальний берег слева с городом
        D.poly(ctx, [(-2000, HZ), (-2000, HZ - 40), (2900, HZ - 60), (3200, HZ)], hexrgb("#1e2a3a"), None, 0, wob=0)
        ctx.save()
        ctx.translate(-1600, HZ - 50)
        ctx.scale(0.35, 0.35)
        LK.town(ctx, 0, 12000, 0, "night", lit=0.15, seed=7)
        ctx.restore()
        r = rng(17)
        for k in range(160):        # город, полный ими: силуэты на улицах
            zx = r.uniform(-1500, 2600)
            zy = HZ - 52 + r.uniform(-4, 6)
            sway = math.sin(t * 2 + k) * 2
            D.line(ctx, zx + sway, zy, zx + sway, zy - 18, hexrgb("#7ee04a"), 3, 0.7)
            D.circle(ctx, zx + sway, zy - 22, 5, hexrgb("#7ee04a"), None, 0, alpha=0.7)
        # мост: ближе — крупнее
        ctx.save()
        ctx.translate(-1300, HZ + 230)
        ctx.scale(0.5, 0.5)

        def crowd(c, x0, x1, deck_y):
            rr = rng(5)
            for k in range(70):
                zx = rr.uniform(x0, x1)
                R.Fig(R.park_zombie(1750 + k)).draw(c, zx, deck_y - 10, 70, 1 if rr.random() > 0.3 else -1,
                                                   R.gait(t * 1.2 + k, "shamble", "side", k))
        LK.bridge(ctx, 0, 6400, 0, "night", t, cars=True, jam=1.0, crowd=crowd)
        ctx.restore()
        # дальний мыс справа и маяк Гаса
        D.poly(ctx, [(4600, HZ), (5000, HZ - 30), (5600, HZ - 34), (6200, HZ)], hexrgb("#1e2a3a"), None, 0, wob=0)
        LK.lighthouse(ctx, LH_X, HZ - 26, 0.16, "night", beam=beam, ang=-0.4, t=t)


def shot_view(ctx, t, S):
    """Панорама слева направо: мост, город, вода."""
    d = S.cue(2) - S.cue(1)
    cam = Cam(Keys((0, 300), (d * 0.15, 300), (d, 4300, "io")), HZ + 120, 0.8)
    panorama(ctx, t, cam)
    fx.darkness(ctx, 0.15)
    labels = (("THE BRIDGE", 0.05), ("THE TOWN", 0.3), ("4 MILES OF WATER", 0.62))
    for txt, k in labels:
        if t > d * k:
            pop_text(ctx, txt, W / 2, 200, t, d * k, 80, "#fff6d8", dur=d * 0.25, shake=False)


def shot_blink(ctx, t, S):
    """Маяк на том берегу мигает: раз, два, три. На переднем плане — Раскал и Бандит на крыше кабинки."""
    d = S.cue(3) - S.cue(2)
    blinks = [d * 0.25, d * 0.45, d * 0.65]
    beam = 1.0 if any(0 <= t - b < 0.3 for b in blinks) else 0.0
    cam = Cam(LH_X - 200, HZ - 40, Keys((0, 1.4), (d, 1.55)))
    panorama(ctx, t, cam, beam)
    fx.darkness(ctx, 0.15, [fx.Light(*cam.to_screen(t, LH_X, HZ - 70), 300, power=0.6 * beam, glow_a=0.0)])
    # силуэты на переднем плане (в экранных координатах)
    D.rect(ctx, 0, H - 120, 520, 140, hexrgb("#1a1a2a"), D.INK, 4, wob=0)
    roof_sitters(ctx, t, 230, H - 120, 1.6, look=0.6)
    for i, b in enumerate(blinks):
        if t > b:
            pop_text(ctx, str(i + 1), W / 2 + 160 + i * 180, 260, t, b, 120, "#fff2a0", dur=d, shake=False)


def shot_far(ctx, t, S):
    """Пунктир полёта от колеса к маяку: вот сколько лететь. Глоток."""
    d = S.dur - S.cue(3)
    cam = Cam(3000, HZ + 100, 0.36)
    panorama(ctx, t, cam, 1.0 if (t % 1.5) < 0.2 else 0.0)
    fx.darkness(ctx, 0.15)
    x0, y0 = cam.to_screen(t, 600, HZ + 800)
    x1, y1 = cam.to_screen(t, LH_X, HZ - 60)
    k = smooth(clamp((t - 0.3) / 1.6))
    pts = []
    for j in range(41):
        u = j / 40 * k
        pts.append((lerp(x0, x1, u), lerp(y0, y1, u) - math.sin(u * math.pi) * 260))
    for j in range(0, len(pts) - 1, 2):
        D.line(ctx, *pts[j], *pts[j + 1], hexrgb("#ffd23a"), 8)
    if k > 0.98:
        D.circle(ctx, x1, y1, 26, None, hexrgb("#ffd23a"), 6)
        pop_text(ctx, "4 MILES", (x0 + x1) / 2, (y0 + y1) / 2 - 320, t, 1.9, 100, "#ffd23a", dur=d, shake=False)
    BL.envelope(ctx, x0 + 40, y0 - 40, 0.06, 1.0, "night", t=t)
    if t > d * 0.6:
        pop_text(ctx, "GULP.", W / 2 + 330, H - 260, t, d * 0.6, 90, "#fff6d8", dur=d, shake=False)


def build(S):
    c = S.cue
    S.shots = [
        Shot(0, shot_climb, "fade", 0.4),
        Shot(c(1) - 0.1, shot_view, "fade", 0.3),
        Shot(c(2) - 0.1, shot_blink, "fade", 0.3),
        Shot(c(3) - 0.1, shot_far, "fade", 0.3),
    ]
    S.tods = [(0, "night")]
    d2 = c(3) - c(2)
    S.sfx += [(0.2, "ladder", 0.8), (c(1), "wind", 0.7), (c(1) + 0.5, "crowd_groan", 0.4)]
    S.sfx += [(c(2) + d2 * k, "ding", 0.5) for k in (0.25, 0.45, 0.65)]
    S.music = [(0, "tension", 0.6), (c(1), "wonder", 1.0), (c(3), "lonely", 0.8)]
