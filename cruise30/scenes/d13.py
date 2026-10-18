"""День 13: шведский стол протух. Еда — на второй палубе, в кладовых экипажа, в конце коридора I-95.
Фонарик и ключ-карта: персики, рис, крекеры — и кухонная команда в белых колпаках.
Побег по аварийной шахте на 14 палуб вверх. За тобой не лезут. Ты проверил."""
from scenes.kit import *
from scenes.shared import *

CHEFS = [R.zombie_look(2300 + i, "chef") for i in range(6)]


def flashlight_dark(ctx, x, y, ang, level=0.92, extra=()):
    fx.darkness(ctx, level, [fx.Light(x, y, 950, kind="cone", ang=ang, spread=0.38, power=0.95, glow_a=0.12)] +
                list(extra))
    flashlight_beam(ctx, x, y, ang, 900, 0.36, 0.14)


def shot_smell(ctx, t, S):
    cam = Cam(Keys((0, 1100), (3, 1150)), 560, Keys((0, 1.35), (3, 1.5)))
    with layer(ctx, cam, t):
        bg(ctx, "buffet_dark", (-500, -300, 3800, 1700), lambda c: IN.buffet(c, "overcast", 0.0))
        for i, x in enumerate((1000, 1180, 2350)):
            for k in range(3):
                ph = (t * 0.7 + k / 3 + i * 0.2) % 1
                pts = [(x - 20 + k * 20 + math.sin(ph * 8 + j) * 12, 560 - ph * 160 - j * 22) for j in range(6)]
                D.polyline(ctx, pts, hexrgb("#7fbf3a"), 5, 1 - ph)
            for k in range(2):
                a = t * 6 + k * 3 + i
                D.circle(ctx, x + math.cos(a) * 50, 520 + math.sin(a * 1.3) * 30, 5, D.INK, None, 0)
        p = R.stand("side", t, 1)
        p.update(face="worried", h1=(0.45, -3.18), hturn=0.7, lean=-0.15)
        LEO_CAP.draw(ctx, 1450, 960, 120, -1, p)
        draw_cat(ctx, 1640, 960, 95, -1, cat_pose(t, "hiss"))
    fx.grade(ctx, "overcast", 0.5)
    pop_text(ctx, "EWWW.", W / 2 + 300, 240, t, 0.4, 120, "#9bd666", dur=2.4)


def shot_decks(ctx, t, S):
    """Схема: палуба 16 → палуба 2, камера ныряет вниз."""
    d = S.cue(2) - S.cue(1)
    D.vgrad(ctx, 0, 0, W, H, [(0, "#1c3f7c"), (1, "#0f2a5a")])
    k = smooth(clamp((t - 0.6) / (d - 1.4)))
    off = k * 1400
    ctx.save()
    ctx.translate(0, -off)
    for i in range(15):
        deck = 16 - i
        y = 140 + i * 130
        hl = deck in (16, 2)
        D.rrect(ctx, 520, y, 880, 100, 16, hexrgb("#e9b949") if hl else hexrgb("#f6f6f2"), D.INK, 4)
        D.text(ctx, "DECK %d" % deck, 640, y + 66, 46, D.FONT_TITLE, D.INK, "left")
        label = {16: "BRIDGE", 15: "BUFFET · POOL", 9: "BOARDWALK", 5: "LIFEBOATS", 2: "I-95 · STORES"}.get(deck)
        if label:
            D.text(ctx, label, 1360, y + 64, 38, D.FONT_TITLE, hexrgb("#c23b33") if hl else hexrgb("#5a6678"), "right")
    ctx.restore()
    ay = lerp(190, 190 + 14 * 130, k) - off
    D.poly(ctx, [(430, ay - 40), (480, ay), (430, ay + 40)], hexrgb("#ff4a3a"), D.INK, 4, wob=0)
    LEO_CAP.head_only(ctx, 350, ay, 90, 1, {"view": "front", "face": "worried", "neck_line": False})


def shot_corridor(ctx, t, S):
    d = S.cue(3) - S.cue(2)
    w = Walk(Keys((0, -200), (d * 0.55, 1300, "lin")), IN.FL, 115, "sneak", t1=10)
    in_store = t > d * 0.55
    if not in_store:
        cam = Cam(lambda tt: w.x(tt) + 350, 560, 1.0)
        with layer(ctx, cam, t):
            bg(ctx, "i95_dark", (-700, -300, 5200, 1700), lambda c: IN.corridor(c, 0.0))
            J = w.draw(ctx, LEO_CAP, t, {"face": "worried", "h1": (0.85, -2.25), "h2": (0.6, -1.9)})
            hx, hy = LEO_CAP.world(w.x(t), IN.FL, 115, 1, J["hand1"])
            D.rrect(ctx, hx - 4, hy - 14, 44, 22, 6, hexrgb("#3a3a40"), D.INK, 3)
        sx, sy = cam.to_screen(t, hx + 40, hy - 4)
        flashlight_dark(ctx, sx, sy, 0.05)
        # аварийные красные лампы
        for k in range(6):
            x, y = cam.to_screen(t, -100 + k * 500 + 260, 35)
            fx.glow(ctx, x, y, 90, "#ff4a3a", 0.35)
    else:
        tt = t - d * 0.55
        cam = Cam(1100, 560, Keys((0, 1.2), (3, 1.3)))
        with layer(ctx, cam, tt):
            bg(ctx, "store_dark", (-500, -300, 3400, 1700), lambda c: IN.storeroom(c, 0.0))
            p = R.stand("side", tt, 1)
            reach = (tt * 1.5) % 1
            p.update(face="happy", h1=(0.9, -2.4 + 0.4 * math.sin(reach * TAU)), h2=(0.5, -1.6))
            LEO_CAP.draw(ctx, 900, IN.FL - 10, 120, 1, p)
            D.rrect(ctx, 760, IN.FL - 260, 120, 160, 30, hexrgb("#2f8fd8"), D.INK, 4)
        ang = -0.25 + 0.3 * math.sin(tt * 1.2)
        flashlight_dark(ctx, *cam.to_screen(tt, 1020, 600), ang, 0.85)
        for i, (txt, c) in enumerate((("PEACHES", "#f2a03a"), ("RICE", "#fff6d8"), ("CRACKERS", "#e9b949"))):
            pop_text(ctx, txt, 1200 + (i % 2) * 220, 280 + i * 120, tt, 0.2 + i * 0.6, 70, c, dur=2.5, shake=False)


def shot_chefs(ctx, t, S):
    cam = Cam(Keys((0, 1300), (2.5, 1250)), 560, Keys((0, 1.3), (0.6, 1.5)), shake=lambda tt: shake_k(tt, 0.4, 0.4, 0.6))
    with layer(ctx, cam, t):
        bg(ctx, "store_dark", (-500, -300, 3400, 1700), lambda c: IN.storeroom(c, 0.0))
        for i in range(4):
            p = zombie_idle(t, i)
            turn = clamp((t - 0.3 - i * 0.1) / 0.2)
            p["hturn"] = 1.0 - 2.0 * turn
            p["mouth"] = 0.5 + 0.4 * turn
            R.Fig(CHEFS[i]).draw(ctx, 1500 + i * 170, IN.FL - 10 + (i % 2) * 20, 115, -1 if i % 2 else 1, p)
        p = R.stand("side", t, 1)
        p.update(face="scream" if t > 0.4 else "shock", blink=0, lean=-0.15, h1=(0.85, -2.2))
        LEO_CAP.draw(ctx, 1180, IN.FL - 10, 120, 1, p)
    flashlight_dark(ctx, *cam.to_screen(t, 1290, 590), 0.05, 0.9)
    if t > 0.4:
        for i in range(4):
            x, y = cam.to_screen(t, 1500 + i * 170, IN.FL - 10 - 330)
            D.text(ctx, "!", x, y, 90, D.FONT_TITLE, hexrgb("#e8423c"), stroke=D.INK, slw=8,
                   alpha=clamp((t - 0.4 - i * 0.05) / 0.1))


def shot_trunk(ctx, t, S):
    d = S.dur - (S.cue(4) - 0.1)
    T_TOP = d * 0.55
    prog = 14 * 300 / 115 * ease_io(clamp(t / T_TOP)) * 0.25
    base = 1200
    y_leo = base - prog * 115
    look_down = t > T_TOP
    cam = Cam(960, lambda tt: base - 14 * 300 / 115 * ease_io(clamp(tt / T_TOP)) * 0.25 * 115 - 250,
              Keys((0, 0.95), (T_TOP, 0.95), (T_TOP + 0.5, 1.2)))
    with layer(ctx, cam, t):
        bg(ctx, "shaft", (-600, -3100, 3200, 4500), lambda c: IN.shaft(c, 960, -3000, 1400, 0.0))
        if not look_down:
            draw_climber(ctx, LEO_CAP, 960, base, 115, prog, 1, "back", "determined")
        else:
            p = climb_pose(prog, "back", "smile")
            p.update(hturn=0.0, look=(0, 1), face="laugh" if t > T_TOP + 1.2 else "worried")
            LEO_CAP.draw(ctx, 960, y_leo, 115, 1, p)
    flashlight_dark(ctx, *cam.to_screen(t, 960, y_leo - 300), -math.pi / 2 if not look_down else math.pi / 2, 0.75)
    if look_down:
        # врезка: внизу шахты повара тянут руки
        ctx.save()
        D.rrect(ctx, 1290, 560, 560, 420, 30, hexrgb("#2b2f3a"), D.INK, 6)
        ctx.rectangle(1296, 566, 548, 408)
        ctx.clip()
        for i in range(4):
            p = zombie_reach(t, i)
            p.update(a1=(2.6, 0.2), a2=(2.4, 0.3), neck=-0.5, mouth=0.9)
            CF = R.Fig(CHEFS[i])
            CF.draw(ctx, 1400 + i * 110, 1180, 90, 1 if i % 2 else -1, p)
        D.rect(ctx, 1296, 566, 548, 408, hexrgb("#000000"), None, 0, wob=0, alpha=0.25)
        ctx.restore()
        D.text(ctx, "DECK 2", 1570, 610, 40, D.FONT_TITLE, hexrgb("#f2c230"))
    if t > T_TOP + 1.2:
        pop_text(ctx, "THEY CAN'T FOLLOW.", W / 2 - 220, 230, t, T_TOP + 1.2, 74, "#4cff8a", dur=4, shake=False)


def build(S):
    c = S.cue
    S.shots = [
        Shot(0, shot_smell),
        Shot(c(1) - 0.1, shot_decks, "fade", 0.3),
        Shot(c(2) - 0.1, shot_corridor, "fade", 0.3),
        Shot(c(3) - 0.2, shot_chefs),
        Shot(c(4) - 0.1, shot_trunk, "whip", 0.3),
    ]
    S.sfx += [(0.3, "flies", 0.7), (c(3), "sting", 1.0), (c(4), "climb", 0.9)]
    S.music = "tension"
