"""День 7: неделя — повод для праздника. Короткий гудок уводит всех на нос, палуба твоя.
Шоколадный фонтан, мороженое всех вкусов, лобстер в джакузи — его съедает Анкор.
Единственный пассажир первого класса в океане."""
from scenes.kit import *
from scenes.shared import *
from scenes.d04 import CONSOLE_Y

ROBE_LEO = R.Fig(R.Look(**{**R.LEO.__dict__, "body": "#fbfaf4", "style": "coat", "length": 0.3,
                         "details": ("robe",), "hat": "captain", "hat_col": "#fbfaf5", "hat_big": 1.08}))
SUNNY_LEO = R.Fig(R.Look(**{**R.LEO_CAP.__dict__, "details": ("waiter", "bowtie", "sunglasses")}))


def confetti(ctx, t, n=60, seed=3, y0=-100):
    r = rng(seed)
    for i in range(n):
        x = r.uniform(0, W)
        sp = r.uniform(200, 420)
        y = (y0 + r.uniform(0, H) + t * sp) % (H + 200) - 100
        a = t * r.uniform(3, 8) + i
        ctx.save()
        ctx.translate(x + math.sin(t * 2 + i) * 30, y)
        ctx.rotate(a)
        ctx.scale(1, abs(math.cos(a)) + 0.2)
        D.rect(ctx, -9, -5, 18, 10, hexrgb(r.choice(["#e8423c", "#f2c230", "#2f8fd8", "#3fbf6a", "#f05a8a"])), None, 0,
               wob=0)
        ctx.restore()


def party_hat(ctx, x, y, s, c="#f05a8a", rot=0.0):
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(rot)
    D.poly(ctx, [(-0.22 * s, 0), (0.22 * s, 0), (0, -0.6 * s)], hexrgb(c), D.INK, 3, wob=0)
    D.circle(ctx, 0, -0.62 * s, 0.07 * s, hexrgb("#f2c230"), D.INK, 2)
    ctx.restore()


def shot_party(ctx, t, S):
    cam = Cam(Keys((0, 1450), (3, 1500)), 560, Keys((0, 1.3), (3, 1.45)))
    bridge_back(ctx, t, cam, "dawn", 1.0, sun=(1600, 330, 60))
    with layer(ctx, cam, t):
        p = R.stand("side", t, 1)
        blow = 0.5 + 0.5 * math.sin(t * 6)
        p.update(face="eat", mouth=0.3, h1=(0.45, -3.0), hturn=0.8)
        J = LEO_CAP.draw(ctx, 1400, BR.BF + 40, 120, 1, p)
        hx, hy = LEO_CAP.world(1400, BR.BF + 40, 120, 1, J["hand1"])
        L = 40 + 120 * blow
        D.line(ctx, hx, hy - 10, hx + L, hy - 14, hexrgb("#2f8fd8"), 14)
        D.circle(ctx, hx + L, hy - 14, 9 + 6 * (1 - blow), hexrgb("#2f8fd8"), D.INK, 2)
        draw_cat(ctx, 1600, CONSOLE_Y, 115, -1, cat_pose(t, "sit"))
        party_hat(ctx, 1590, CONSOLE_Y - 150, 70, "#3fbf6a", -0.2)
    confetti(ctx, t)
    pop_text(ctx, "1 WEEK!", W / 2, 230, t, 0.3, 140, "#ffe36a", dur=3.0, shake=False)


def shot_tap(ctx, t, S):
    tp = 0.5
    cam = Cam(BR.HORN_X, 570, 2.6, shake=lambda tt: shake_k(tt, tp, 0.4, 0.5))
    bridge_back(ctx, t, cam, "dawn", 1.0, sun=(1600, 330, 60))
    with layer(ctx, cam, t):
        k = clamp(t / tp)
        fy = lerp(380, 560, ease_in(k)) if t < tp + 0.15 else lerp(560, 400, clamp((t - tp - 0.15) / 0.3))
        D.line(ctx, BR.HORN_X - 200, fy - 200, BR.HORN_X - 6, fy, D.INK, 28)
        D.circle(ctx, BR.HORN_X, fy, 18, D.INK, None, 0)
    if t > tp:
        pop_text(ctx, "toot.", W / 2 + 200, 300, t, tp, 110, "#fff6d8", dur=1.0)


def shot_cannonball(ctx, t, S):
    """Пустая палуба на рассвете. Лео в тёмных очках — бомбочкой в бассейн."""
    T_JUMP = 1.4
    cam = Cam(Keys((0, 1300), (T_JUMP, 1700), (3.0, 1900)), Keys((0, 640), (3.0, 680)), Keys((0, 0.75), (3.0, 0.9)))
    deck_back(ctx, t, cam, "morning", 1.0, sun=(300, 300, 70), mess=0.3)
    with layer(ctx, cam, t):
        if t < T_JUMP:
            w = Walk(Keys((0, 900), (T_JUMP, DK.POOL[0] + 200, "in")), 1000, 105, "run", t1=3)
            w.draw(ctx, SUNNY_LEO, t, {"face": "laugh"})
        else:
            k = (t - T_JUMP) / 0.7
            if k < 1:
                x = lerp(DK.POOL[0] + 200, 1900, k)
                y = 1000 - math.sin(math.pi * k) * 360 + 200 * k
                p = R.stand("side", t, 1)
                p.update(face="laugh", k1=(1.8, 2.4), k2=(1.6, 2.3), h1=(0.5, -1.0), h2=(0.45, -0.95), hip=(0, 0.8))
                ctx.save()
                ctx.translate(x, y)
                ctx.rotate(k * 1.5)
                SUNNY_LEO.draw(ctx, 0, 0, 105, 1, p)
                ctx.restore()
            else:
                p = R.stand("front", t, 1)
                p.update(face="laugh", a1=(2.6, 0.3), a2=(2.6, 0.3))
                SUNNY_LEO.draw(ctx, 1900, DK.GF + 160, 105, 1, p)
        DK.water(ctx, t, *DK.POOL, DK.GF + 14, tod="morning", ripples=[(1900, T_JUMP + 0.7)])
        SEA.splash(ctx, 1900, DK.GF + 10, (t - T_JUMP - 0.7) / 0.9, 1.6, seed=4, c="#e8fbff")
    if t > T_JUMP + 0.7:
        pop_text(ctx, "SPLOOSH!", W / 2, 260, t, T_JUMP + 0.7, 150, "#7fd0ff", dur=1.2)
    D.rrect(ctx, 40, 860, 520, 90, 20, hexrgb("#fff6d8"), D.INK, 5)
    D.text(ctx, "THE POOL DECK IS YOURS", 300, 920, 38, D.FONT_TITLE, D.INK)


def shot_food(ctx, t, S):
    """Завтрак: шоколадный фонтан. Обед: башня мороженого всех вкусов."""
    d = S.cue(3) - S.cue(2)
    half = d * 0.48
    if t < half:
        cam = Cam(IN.CHOCO_X, 520, Keys((0, 1.9), (half, 2.1)))
        with layer(ctx, cam, t):
            bg(ctx, "buffet_day", (-500, -300, 3800, 1700), lambda c: IN.buffet(c, "day", 1.0), 1.4)
            IN.chocolate_flow(ctx, t)
            p = R.stand("side", t, 1)
            p.update(face="eat", mouth=0.8, lean=0.35, h1=(0.7, -2.2), hturn=0.7)
            LEO_CAP.draw(ctx, IN.CHOCO_X - 200, 960, 125, 1, p)
            D.line(ctx, IN.CHOCO_X - 30, 480, IN.CHOCO_X - 75, 560, hexrgb("#6b3a24"), 10)
        D.text(ctx, "BREAKFAST", W / 2, 180, 90, D.FONT_TITLE, hexrgb("#ffe36a"), stroke=D.INK, slw=10)
    else:
        tt = t - half
        cam = Cam(IN.ICE_X, 470, Keys((0, 2.0), (2, 1.6)))
        with layer(ctx, cam, tt):
            bg(ctx, "buffet_day", (-500, -300, 3800, 1700), lambda c: IN.buffet(c, "day", 1.0), 1.4)
            p = R.stand("front", tt, 1)
            p.update(face="happy", h1=(0.62, -1.95), h2=(-0.4, -1.3))
            J = LEO_CAP.draw(ctx, IN.ICE_X - 260, 960, 125, 1, p)
            hx, hy = LEO_CAP.world(IN.ICE_X - 260, 960, 125, 1, J["hand1"])
            D.poly(ctx, [(hx - 22, hy - 10), (hx + 22, hy - 10), (hx, hy + 50)], hexrgb("#d9a25a"), D.INK, 3, wob=0)
            n = min(8, int(clamp(tt / 1.6) * 8) + 1)
            cols = ["#f6e3c4", "#7a4a30", "#f08cb0", "#9bd666", "#f2c230", "#7fd0ff", "#c9a0f0", "#e8423c"]
            for i in range(n):
                wob = math.sin(tt * 4 + i) * (2 + i * 1.5)
                D.circle(ctx, hx + wob, hy - 30 - i * 34, 30, hexrgb(cols[i]), D.INK, 3)
        D.text(ctx, "LUNCH", W / 2, 180, 90, D.FONT_TITLE, hexrgb("#ffe36a"), stroke=D.INK, slw=10)


def hot_tub_scene(ctx, t, cam, lobster=True, cat_k=-1.0, face="happy"):
    deck_back(ctx, t, cam, "sunset", 1.0, sun=(DK.TUB[0] + 600, 520, 80))
    with layer(ctx, cam, t):
        cx = (DK.TUB[0] + DK.TUB[1]) / 2
        p = R.stand("side", t, 1)
        p.update(face=face, hip=(0, 1.15), h2=(0.75, -2.0), h1=(-0.4, -2.2), lean=-0.1, hturn=0.7)
        J = ROBE_LEO.draw(ctx, cx - 30, DK.GF + 40, 105, 1, p)
        # вода с пузырями поверх
        D.rrect(ctx, DK.TUB[0] + 18, DK.GF - 78, DK.TUB[1] - DK.TUB[0] - 36, 50, 18, hexrgb("#6fe0f0"), D.INK, 3,
                alpha=0.88)
        r = rng(2)
        for i in range(14):
            ph = (t * 0.9 + r.random()) % 1
            bx = r.uniform(DK.TUB[0] + 40, DK.TUB[1] - 40)
            D.circle(ctx, bx, DK.GF - 70 - ph * 50, 6 + 6 * ph, None, hexrgb("#ffffff"), 2.5, 1 - ph)
        # лобстер на тарелке
        hx, hy = ROBE_LEO.world(cx - 30, DK.GF + 40, 105, 1, J["hand2"])
        D.ellipse(ctx, hx + 20, hy - 6, 60, 12, hexrgb("#ffffff"), D.INK, 3)
        if lobster:
            lobster_draw(ctx, hx + 20, hy - 22, 1.0)
        if cat_k >= 0:
            k = clamp(cat_k)
            x = lerp(DK.TUB[1] + 260, hx + 30, ease_out(clamp(k * 2)))
            if k < 0.5:
                y = DK.GF - math.sin(math.pi * k * 2) * 160
                draw_cat(ctx, x, y + 0 if k > 0 else DK.GF, 100, -1, cat_pose(t, "jump" if 0 < k < 0.5 else "stand",
                                                                              jump=k * 2, height=0.0))
            else:
                kk = (k - 0.5) * 2
                x2 = lerp(hx + 30, DK.TUB[1] + 380, ease_in(kk))
                draw_cat(ctx, x2, DK.GF, 100, 1, cat_pose(t, "run", phase=t * 3))
                lobster_draw(ctx, x2 + 70, DK.GF - 62, 0.8)


def lobster_draw(ctx, x, y, s):
    ctx.save()
    ctx.translate(x, y)
    ctx.scale(s, s)
    D.ellipse(ctx, 0, 0, 46, 16, hexrgb("#e8423c"), D.INK, 3)
    for k in range(3):
        D.line(ctx, -30 + k * 20, 6, -40 + k * 20, 22, D.INK, 3)
    D.ellipse(ctx, 50, -10, 18, 10, hexrgb("#e8423c"), D.INK, 3, rot=-0.5)
    D.ellipse(ctx, 50, 10, 18, 10, hexrgb("#e8423c"), D.INK, 3, rot=0.5)
    D.poly(ctx, [(-46, 0), (-66, -14), (-66, 14)], hexrgb("#e8423c"), D.INK, 3, wob=0)
    D.circle(ctx, 30, -10, 3, D.INK, None, 0)
    ctx.restore()


def shot_tub(ctx, t, S):
    cam = Cam((DK.TUB[0] + DK.TUB[1]) / 2 + 60, 680, Keys((0, 1.35), (4, 1.5)))
    hot_tub_scene(ctx, t, cam)
    D.text(ctx, "DINNER", W / 2, 180, 90, D.FONT_TITLE, hexrgb("#ffe36a"), stroke=D.INK, slw=10)


def shot_steal(ctx, t, S):
    cam = Cam((DK.TUB[0] + DK.TUB[1]) / 2 + 160, 690, 1.35)
    k = clamp((t - 0.2) / 1.6)
    hot_tub_scene(ctx, t, cam, lobster=k < 0.5, cat_k=k, face="shock" if 0.45 < k < 0.9 else "smile")
    if t > 1.9:
        pop_text(ctx, "...fair.", W / 2 - 300, 280, t, 1.9, 90, "#fff6d8", dur=1.4)


def shot_first_class(ctx, t, S):
    cam = Cam(Keys((0, 1900), (4, 2000)), Keys((0, 760), (4, 640)), Keys((0, 1.3), (4, 0.85)))
    deck_back(ctx, t, cam, "night", 1.0, moon=(2800, -150, 45))
    with layer(ctx, cam, t):
        DK.lounger(ctx, 1900, DK.GF + 40, hexrgb("#f2c230"), "night")
        p = R.stand("side", t, 1)
        p.update(face="smile", a1=(3.2, 2.4), a2=(3.1, 2.4), k1=(0.4, 0.2), k2=(0.3, 0.1))
        ctx.save()
        ctx.translate(1990, DK.GF - 36)
        ctx.rotate(-1.3)
        ROBE_LEO.draw(ctx, 0, 0, 90, 1, p)
        ctx.restore()
        draw_cat(ctx, 1830, DK.GF - 20, 80, 1, cat_pose(t, "sleep"))
        DK.water(ctx, t, *DK.POOL, DK.GF + 14, tod="night")
    fx.glow(ctx, *cam.to_screen(t, 1900, 600), 500, "#ffd978", 0.15)
    k = ease_out_back(clamp((t - 0.8) / 0.4))
    if k > 0:
        ctx.save()
        ctx.translate(W / 2, 200)
        ctx.scale(k, k)
        D.rrect(ctx, -330, -70, 660, 130, 30, hexrgb("#e9b949"), D.INK, 6)
        D.text(ctx, "FIRST CLASS", 0, 30, 84, D.FONT_TITLE, D.INK)
        ctx.restore()


def build(S):
    c = S.cue
    S.shots = [
        Shot(0, shot_party),
        Shot(c(1) - 0.2, shot_tap),
        Shot(c(1) + 1.6, shot_cannonball, "whip", 0.3),
        Shot(c(2) - 0.1, shot_food, "fade", 0.25),
        Shot(c(3) - 0.1, shot_tub, "fade", 0.3),
        Shot(c(4) - 0.1, shot_steal),
        Shot(c(5) - 0.2, shot_first_class, "fade", 0.4),
    ]
    S.tods = [(0, "dawn"), (c(2), "day"), (c(5), "night")]
    S.sfx += [(0.2, "party_horn", 0.8), (c(1) + 0.3, "horn_short", 0.9), (c(1) + 1.6 + 2.1, "splash", 1.0),
              (c(4) + 1.0, "meow", 0.8)]
    S.music = "party"
