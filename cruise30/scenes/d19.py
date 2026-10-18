"""День 19: Максу девять. В девять вечера Долорес нарушает правила и соединяет рацию с телефоном.
«Лео? Сынок? Это мама». Макс: «Видел акул?». Тихое «С днём рождения» на мостике мёртвого корабля.
Мама плачет. Ты — нет. Почти."""
from scenes.kit import *
from scenes.shared import *
from scenes.d06 import dolores_at_radio, leo_mic

MOON = (2000, 150, 40)


def max_photo(ctx, x, y, s=1.0, rot=0.05):
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(rot)
    ctx.scale(s, s)
    D.rect(ctx, -110, -140, 220, 260, hexrgb("#ffffff"), D.INK, 4, wob=0)
    D.rect(ctx, -95, -125, 190, 190, hexrgb("#7fd0ff"), None, 0, wob=0)
    MAX.head_only(ctx, 0, -20, 110, 1, {"view": "front", "face": "laugh", "neck_line": False})
    D.text(ctx, "MAX", 0, 105, 34, D.FONT_HAND, D.INK)
    D.rect(ctx, -30, -150, 60, 22, hexrgb("#f2e6a0"), None, 0, wob=0, alpha=0.8)
    ctx.restore()


def shot_birthday(ctx, t, S):
    cam = Cam(Keys((0, 1300), (3, 1350)), 560, Keys((0, 1.6), (3, 1.75)))
    bridge_back(ctx, t, cam, "night", 0.0, moon=MOON, battery=40, autopilot=False)
    with layer(ctx, cam, t):
        max_photo(ctx, 1360, 470, 0.9)
        D.circle(ctx, 1470, 380, 46, hexrgb("#f05a8a"), D.INK, 3)
        D.text(ctx, "9", 1470, 400, 60, D.FONT_TITLE, hexrgb("#fff6d8"))
        D.curve(ctx, [(1470, 426), (1460, 470), (1480, 520)], D.INK, 2)
    fx.darkness(ctx, 0.35, [fx.Light(W / 2, H / 2, 900, power=0.7, glow="#ffd8a0", glow_a=0.12)])
    pop_text(ctx, "MAX TURNS 9", W / 2, 200, t, 0.3, 100, "#ffe36a", dur=3.0, shake=False)


def shot_patch(ctx, t, S):
    """Долорес втыкает кабель рации в старый телефон и набирает номер."""
    cam = Cam(Keys((0, 700), (5, 760)), 560, Keys((0, 1.35), (5, 1.45)))
    dolores_at_radio(ctx, t, cam, talk=0.0, face="worried", stand=False)
    with layer(ctx, cam, t):
        D.rrect(ctx, 960, 610, 160, 90, 20, hexrgb("#c23b33"), D.INK, 4)
        D.circle(ctx, 1040, 650, 30, hexrgb("#f4f2ec"), D.INK, 3)
        D.curve(ctx, [(930, 640), (950, 580), (1000, 590)], D.INK, 14)
        k = smooth(clamp((t - 0.8) / 1.2))
        D.curve(ctx, [(760, 620), (820, 700 + 30 * k), (lerp(840, 980, k), lerp(680, 690, k))], hexrgb("#2b2f3a"), 8)
        D.circle(ctx, lerp(840, 980, k), lerp(680, 690, k), 9, hexrgb("#e9b949"), D.INK, 2)
    if t > 0.5:
        pop_text(ctx, "shh...", 640, 280, t, 0.5, 80, "#fff6d8", dur=1.5)
    if t > 2.4:
        for i in range(3):
            ph = (t * 1.5 + i / 3) % 1
            x, y = cam.to_screen(t, 1040, 600)
            D.circle(ctx, x, y - 30, 30 + 90 * ph, None, hexrgb("#fff6d8"), 5, 1 - ph)
        pop_text(ctx, "MIAMI", 1350, 260, t, 2.4, 90, "#7fd0ff", dur=3, shake=False)


def mom_side(ctx, t, cam, talk=1.0, face="cry", max_on=False):
    with layer(ctx, cam, t):
        bg(ctx, "miami_kitchen", (-500, -300, 3400, 1700), IN.miami_kitchen)
        p = R.stand("side", t, 6)
        p.update(face=face, h1=(0.38, -3.2), tears=1.0 if face == "cry" else 0.0, tears_t=t,
                 mouth=0.3 + 0.3 * abs(math.sin(t * 8)) * talk, hturn=0.6)
        J = MOM.draw(ctx, 1000, IN.FL + 20, 130, 1, p)
        hx, hy = MOM.world(1000, IN.FL + 20, 130, 1, J["hand1"])
        IN.phone(ctx, hx + 8, hy - 10, 1.0, 0.3)
        if max_on:
            jump = abs(math.sin(t * 7)) * 30
            pm = R.stand("side", t, 7)
            pm.update(face="laugh", mouth=0.8, a1=(2.6, 0.3), a2=(2.4, 0.3), hturn=0.7)
            MAX.draw(ctx, 1250, IN.FL + 20 - jump, 130, -1, pm)


def shot_mom(ctx, t, S):
    camL = Cam(2240, 560, 1.4)
    camR = Cam(560, 600, 1.4)
    diag_split(ctx, lambda c: leo_mic(c, t, camL, "shock" if t < 1.2 else "cry", 0.0),
               lambda c: mom_side(c, t, camR, 1.0 if t > 0.8 else 0.0, "cry"), clamp(t / 0.5))
    pop_text(ctx, "*click*", W / 2, 230, t, 0.1, 70, "#fff6d8", dur=0.8)
    if t > 0.9:
        D.rrect(ctx, 1300, 820, 300, 100, 30, hexrgb("#fff6d8"), D.INK, 5)
        D.text(ctx, "MOM", 1450, 890, 60, D.FONT_TITLE, D.INK)


def shot_sharks(ctx, t, S):
    cam = Cam(1150, 560, Keys((0, 1.3), (3, 1.45)))
    mom_side(ctx, t, cam, 0.0, "laugh", max_on=True)
    k = ease_out_back(clamp((t - 0.3) / 0.3))
    if k > 0:
        ctx.save()
        ctx.translate(1300, 260)
        ctx.scale(k, k)
        D.rrect(ctx, -420, -110, 840, 200, 60, hexrgb("#ffffff"), D.INK, 6)
        D.poly(ctx, [(-60, 86), (0, 86), (-100, 170)], hexrgb("#ffffff"), D.INK, 6, wob=0)
        D.text(ctx, "SEEN ANY SHARKS??", 0, 22, 74, D.FONT_TITLE, D.INK)
        ctx.restore()
        ctx.save()
        ctx.translate(420, 300)
        ctx.rotate(-0.1)
        D.poly(ctx, [(-120, 30), (60, 10), (140, 30), (60, 60), (-120, 40)], hexrgb("#7f9fb8"), D.INK, 4, wob=0)
        D.poly(ctx, [(-10, 14), (30, -60), (60, 14)], hexrgb("#7f9fb8"), D.INK, 4, wob=0)
        D.circle(ctx, 100, 28, 5, D.INK, None, 0)
        ctx.restore()


def shot_sing(ctx, t, S):
    camL = Cam(2240, 560, Keys((0, 1.4), (6, 1.6)))
    camR = Cam(560, 600, Keys((0, 1.3), (6, 1.4)))

    def leo(c):
        leo_mic(c, t, camL, "sad", 0.0)
        with layer(c, camL, t):
            x, y = 2020, 690
            D.rrect(c, x - 40, y - 40, 80, 50, 10, hexrgb("#f05a8a"), D.INK, 3)
            D.line(c, x, y - 40, x, y - 80, hexrgb("#fff6d8"), 6)
            fx.glow(c, x, y - 92, 60, "#ffd978", 0.6)
            D.ellipse(c, x, y - 92, 7, 12, hexrgb("#ffd978"), None, 0)

    def mom(c):
        mom_side(c, t, camR, 0.0, "cry", max_on=False)

    diag_split(ctx, leo, mom, 1.0)
    for i in range(4):
        ph = (t * 0.5 + i / 4) % 1
        D.text(ctx, "♪", 520 + i * 70, 420 - ph * 160, 46, D.FONT_HAND, hexrgb("#fff6d8"), alpha=(1 - ph) * 0.8)
    D.text(ctx, "happy birthday to you...", 560, 200, 54, D.FONT_HAND, hexrgb("#fff6d8"), stroke=D.INK, slw=6,
           alpha=0.9)
    # Долорес вытирает слезу — врезка
    D.rrect(ctx, 1560, 70, 300, 260, 30, hexrgb("#f6d8b0"), D.INK, 5)
    DOLORES.head_only(ctx, 1710, 200, 150, 1, {"view": "front", "face": "cry", "tears": 1.0, "tears_t": t,
                                                "neck_line": False})


def build(S):
    c = S.cue
    S.shots = [
        Shot(0, shot_birthday),
        Shot(c(1) - 0.1, shot_patch, "fade", 0.3),
        Shot(c(2) - 0.1, shot_mom),
        Shot(c(3) - 0.1, shot_sharks, "whip", 0.3),
        Shot(c(4) - 0.1, shot_sing, "fade", 0.3),
    ]
    S.sfx += [(c(1) + 2.4, "dial", 0.7), (c(2), "click", 0.8), (c(4) + 0.5, "humming", 0.5)]
    S.music = "tender"
