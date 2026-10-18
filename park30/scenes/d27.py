"""День 27 (ночь): выбор. Бандит с малышами летят. Единорог Лили летит — ты обещал. Значит, остаётся Раскал. Вешаешь
костюм на карусель и говоришь «спасибо». 30 дней он делал тебя невидимым. На 30-й ты сам по себе."""
from scenes.kit import *
from scenes.shared import *

FL = PK.FL
BASKET_X = 1500
CX = 1500                    # карусель (центр)
CGY = FL + 500


def courtyard_back(ctx, t, cam):
    sky_back(ctx, t, cam, "night", -4000, 7000, moon=(2600, -600, 110))
    with layer(ctx, cam, t):
        CA.courtyard(ctx, "night", -1800, 4200, FL, t=t)


def crate(ctx, x, gy, w=220, h=150):
    D.rect(ctx, x - w / 2, gy - h, w, h, hexrgb("#c8903a"), D.INK, 4, wob=0)
    D.line(ctx, x - w / 2, gy - h, x + w / 2, gy, hexrgb("#a8702a"), 5)
    for k in range(3):
        D.circle(ctx, x - 60 + k * 60, gy - h * 0.6, 10, hexrgb("#2b2420"), None, 0)


def shot_choice(ctx, t, S):
    """Двор ночью: корзина у свёрнутого шара; рядом единорог, Бандит с малышами; Тео перед ними."""
    d = S.cue(1) - 0.1
    cam = Cam(BASKET_X - 250, FL - 380, Keys((0, 0.7), (d, 0.76)))
    courtyard_back(ctx, t, cam)
    with layer(ctx, cam, t):
        BL.folded(ctx, BASKET_X + 700, FL + 120, 0.8, "night")
        BL.basket(ctx, BASKET_X, FL + 140, 1.0, "night", 0.0, t, tanks=2)
        IN.unicorn(ctx, BASKET_X - 650, FL + 140, 0.7, "night", 1, t)
        crate(ctx, BASKET_X + 330, FL + 150)
        draw_raccoon(ctx, BASKET_X + 300, FL - 10, 95, -1, raccoon_pose(t, "sit", look=-0.3))
        for b in range(3):
            draw_raccoon(ctx, BASKET_X + 380 + b * 45, FL - 40, 55, -1, raccoon_pose(t + b, "peek", baby=True))
        p = R.stand("back", t, 1)
        p.update(h1=(-0.3, -1.7), h2=(0.3, -1.7))
        THEO_FUR_PATCH.draw(ctx, BASKET_X - 1150, FL + 380, 120, 1, p)
    fx.darkness(ctx, 0.3, [fx.Light(W / 2, 520, 900, power=0.5, glow_a=0.0)])
    pop_text(ctx, "THE CHOICE", W / 2, 200, t, 0.3, 100, "#fff6d8", dur=d, shake=False)


def check(ctx, x, y, s=1.0):
    D.circle(ctx, x, y, 40 * s, hexrgb("#3fbf6a"), D.INK, 4)
    D.polyline(ctx, [(x - 18 * s, y), (x - 4 * s, y + 16 * s), (x + 20 * s, y - 14 * s)], hexrgb("#fbfaf6"), 9 * s)


def shot_coming(ctx, t, S):
    """Грузим: ящик с семьёй — в корзину; единорог — на трос у корзины. Галочки: летят."""
    d = S.cue(2) - S.cue(1)
    T2 = d * 0.5
    cam = Cam(BASKET_X - 100, FL - 300, 0.95)
    courtyard_back(ctx, t, cam)
    with layer(ctx, cam, t):
        k1 = smooth(clamp((t - 0.3) / 0.8))
        k2 = smooth(clamp((t - T2) / 0.8))

        def inside(c, x, rim, s):
            if k1 >= 1:
                draw_raccoon(c, x + 60, rim + 10, 95, -1, raccoon_pose(t, "sit", look=0.3))
                for b in range(3):
                    draw_raccoon(c, x - 20 - b * 45, rim - 10, 55, 1, raccoon_pose(t + b, "peek", baby=True))
        BL.basket(ctx, BASKET_X, FL + 140, 1.0, "night", 0.0, t, tanks=2, inside=inside)
        if k1 < 1:
            cx = lerp(BASKET_X + 330, BASKET_X, k1)
            cy = lerp(FL + 150, FL + 140 - 300, k1) - math.sin(k1 * math.pi) * 120
            crate(ctx, cx, cy, 200, 130)
            draw_raccoon(ctx, cx - 20, cy - 130, 80, -1, raccoon_pose(t, "sit", look=0.2))
        # единорог привязан к корзине сбоку
        ux = lerp(BASKET_X - 650, BASKET_X - 330, k2)
        IN.unicorn(ctx, ux, FL + 140, 0.7, "night", 1, t)
        if k2 > 0.9:
            D.line(ctx, ux + 120, FL - 160, BASKET_X - 180, FL - 120, hexrgb("#c9d0d6"), 5)
    fx.darkness(ctx, 0.25)
    if t > 1.1:
        check(ctx, 1260, 230)
        D.text(ctx, "BANDIT + BABIES", 1330, 248, 50, D.FONT_TITLE, hexrgb("#fff6d8"), "left")
    if t > T2 + 0.9:
        check(ctx, 1260, 340)
        D.text(ctx, "LILY'S UNICORN", 1330, 358, 50, D.FONT_TITLE, hexrgb("#fff6d8"), "left")
        pop_text(ctx, "YOU PROMISED.", 420, 260, t, T2 + 0.9, 80, "#ff8ac8", dur=d, shake=False)


def shot_stays(ctx, t, S):
    """Голова Раскала на ящике в темноте, Тео смотрит на неё. «Раскал остаётся»."""
    d = S.cue(3) - S.cue(2)
    cam = Cam(BASKET_X - 1200, FL - 380, Keys((0, 1.35), (d, 1.5)))
    courtyard_back(ctx, t, cam)
    with layer(ctx, cam, t):
        crate(ctx, BASKET_X - 1000, FL + 140, 260, 220)
        RASCAL.head_only(ctx, BASKET_X - 1000, FL + 140 - 220 - 100, 112 * 1.15, 1,
                         {"view": "front", "neck_line": False, "inner": None})
        p = R.stand("side", t, 1)
        p.update(face="sad", look=(1, 0.2), h1=(0.3, -1.7), h2=(0.2, -1.7))
        THEO_FUR_PATCH.draw(ctx, BASKET_X - 1500, FL + 160, 112, 1, p)
    fx.darkness(ctx, 0.35, [fx.Light(*cam.to_screen(t, BASKET_X - 1000, FL - 200), 500, power=0.6, glow_a=0.0)])
    if t > 0.3:
        pop_text(ctx, "RASCAL STAYS.", W / 2 + 330, 230, t, 0.3, 100, "#fff6d8", dur=d, shake=False)


def costume_rider(t):
    """Пустой костюм Раскала обмяк в седле передней лошадки."""
    def fn(c, i, hx, hy, hs, f, front):
        if i != 2:
            return
        p = sit_pose(t, 1, "neutral")
        p.update(f1=(0.5, 0.3), f2=(0.42, 0.3), a1=(0.25, 0.75), a2=(0.15, 0.8), lean=0.4, neck=0.35, breathe=0)
        RASCAL_PATCH.draw(c, hx - f * 10 * hs, hy + 120 * hs, 80 * hs, f, rascal_pose(p, None))
    return fn


def shot_thanks(ctx, t, S):
    """Карусель ночью: пустой костюм сидит на лошадке; Тео без костюма — «спасибо» — и уходит. Дальше — сам."""
    d = S.dur - S.cue(3)
    L = S.cue(3, True) - S.cue(3)
    T_WALK = L * 0.55
    cam = Cam(Keys((0, CX + 250), (T_WALK, CX + 350), (d, CX + 900, "io")), CGY - 520,
              Keys((0, 0.8), (d, 0.66, "io")), anchor=(CX, 520))
    grass_back(ctx, t, cam, "night", -3000, 7000)
    with layer(ctx, cam, t):
        RD.carousel(ctx, CX, CGY, 1.0, 0.35, t, "night", run=0.0, music=0.0, lights=False, riders=costume_rider(t))
        gy = CGY + 150
        if t < T_WALK:
            p = R.stand("side", t, 1)
            wave = t > T_WALK * 0.4
            p.update(face="smile" if wave else "sad", look=(1, -0.3),
                     h1=(0.9, -2.9 + 0.1 * math.sin(t * 6)) if wave else (0.3, -1.7))
            THEO.draw(ctx, CX + 650, gy, 112, -1, p)
        else:
            w = Walk(Keys((0, CX + 650), (d - T_WALK, CX + 2500, "lin")), gy, 112, "walk", t1=d + 1)
            w.draw(ctx, THEO, t - T_WALK, dict(face="neutral"))
    fx.darkness(ctx, 0.3, [fx.Light(*cam.to_screen(t, CX + 200, CGY - 400), 800, power=0.5, glow_a=0.0)])
    if T_WALK * 0.4 < t < T_WALK + 1.0:
        speech(ctx, 1400, 220, "THANK YOU.", t, T_WALK * 0.4, 66, tail=(-1, 1), dur=T_WALK + 1.0 - T_WALK * 0.4)
    if t > T_WALK + 0.8:
        pop_text(ctx, "ON YOUR OWN.", W / 2 - 300, 240, t, T_WALK + 0.8, 90, "#fff6d8", dur=d, shake=False)


def build(S):
    c = S.cue
    S.shots = [
        Shot(0, shot_choice, "fade", 0.4),
        Shot(c(1) - 0.1, shot_coming, "fade", 0.3),
        Shot(c(2) - 0.1, shot_stays, "fade", 0.4),
        Shot(c(3) - 0.1, shot_thanks, "fade", 0.4),
    ]
    S.tods = [(0, "night")]
    S.sfx += [(c(1) + 1.1, "ding", 0.5), (c(1) + (c(2) - c(1)) * 0.5 + 0.9, "ding", 0.5), (c(3) + 0.5, "crickets", 0.5)]
    S.music = [(0, "lonely", 0.7), (c(1), "warm", 0.8), (c(2), "lonely", 0.8), (c(3), "warm", 0.6)]
