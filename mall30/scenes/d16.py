"""День 16: лифт — «дзынь». Внутри охранник Гас, который не ушёл домой. Погоня и мебельный."""
from scenes.kit import *
from scenes.shared import gallery_bg, gallery_rail, gs, GF
from scenes.d05 import store_x
from sets import stores as ST

LOBBY_FLOOR = 880


def lobby(c):
    D.rect(c, -400, -100, 2800, 1400, M.WALL, None, 0, wob=0)
    D.rect(c, -400, -100, 2800, 160, M.CEIL, None, 0, wob=0)
    C.ceiling_lights(c, -300, 2400, 80, 420, 170, 1.0)
    D.rect(c, -400, LOBBY_FLOOR, 2800, 400, M.FLOOR, None, 0, wob=0)
    D.line(c, -400, LOBBY_FLOOR, 2400, LOBBY_FLOOR, D.INK, 3)
    M.elevator(c, 960, LOBBY_FLOOR)
    C.planter(c, 400, LOBBY_FLOOR, 1.2, seed=3)
    C.planter(c, 1560, LOBBY_FLOOR, 1.2, seed=4)


def paint_cart(ctx, x, gy, s=1.0):
    ctx.save()
    ctx.translate(x, gy)
    ctx.scale(s, s)
    D.rect(ctx, -100, -40, 200, 20, hexrgb("#6a6862"), D.INK, 3, wob=0)
    for wx in (-80, 80):
        D.circle(ctx, wx, -10, 10, D.INK, None, 0)
    for k in range(3):
        for j in range(2):
            D.rect(ctx, -95 + k * 64, -110 - j * 70, 58, 66, hexrgb("#f4f1ea"), D.INK, 2.5, wob=0)
            D.rect(ctx, -95 + k * 64, -100 - j * 70, 58, 14, hexrgb("#3f8a84"), None, 0, wob=0)
    D.line(ctx, -100, -40, -150, -170, D.INK, 6)
    ctx.restore()


def shot_button(ctx, t, S):
    T_DING = S.cue(0, True) - 0.5
    cam = Cam(Keys((0, 1120), (T_DING, 1180)), 580, Keys((0, 1.25), (T_DING, 1.5)))
    ding = 1.0 if t > T_DING else 0.0
    with layer(ctx, cam, t):
        bg(ctx, "lobby", (-400, -100, 2800, 1400), lobby)
        M.elevator(ctx, 960, LOBBY_FLOOR, ding=ding)
        M.elevator_doors(ctx, 960, LOBBY_FLOOR, 0.0)
        M.call_panel(ctx, 1240, 600, pressed=1.0 if t > T_DING - 1.2 else 0.0)
        paint_cart(ctx, 1600, LOBBY_FLOOR + 30, 1.1)
        p = R.stand("side", t, 1)
        press = smooth((t - (T_DING - 1.6)) / 0.4) * (1 - smooth((t - (T_DING - 0.9)) / 0.3))
        p.update(a1=(0.3 + 1.2 * press, 0.2), hturn=0.8)
        HERO.draw(ctx, 1400, LOBBY_FLOOR + 30, 95, -1, p)
        draw_dog(ctx, 1500, LOBBY_FLOOR + 34, 80, -1, dog_pose(t, "sit"))
    fx.grade(ctx, "warm", 0.15)
    if t > T_DING:
        k = clamp((t - T_DING) / 0.15)
        D.text(ctx, "DING!", W / 2 + 120, 280, 110, D.FONT_TITLE, hexrgb("#ffd34a"), stroke=D.INK, slw=12,
               alpha=k * clamp(2 - (t - T_DING)))


def shot_doors(ctx, t, S):
    """Двери разъезжаются: в тёмной кабине Гас в фуражке."""
    op = smooth(t / 1.0)
    cam = Cam(960, Keys((0, 640), (3, 600)), Keys((0, 1.3), (3, 1.9, "in")))
    with layer(ctx, cam, t):
        bg(ctx, "lobby", (-400, -100, 2800, 1400), lobby)
        p = zombie_idle(t, 7, "front")
        p.update(neck=0.35, htilt=0.25)
        GUS_Z.draw(ctx, 960, LOBBY_FLOOR, 95, 1, p)
        M.elevator_doors(ctx, 960, LOBBY_FLOOR, op)
    fx.darkness(ctx, 0.3, [fx.Light(*cam.to_screen(t, 960, 500), 900, power=0.6, glow_a=0.0)])
    fx.grade(ctx, "warm", 0.15)


def shot_memory_gus(ctx, t, S):
    """Вспышка-воспоминание: день 1, Гас машет и уходит."""
    from scenes.d01 import entrance_scene, es
    cam = Cam(900, 600, 1.6)
    entrance_scene(ctx, t + 2, cam, crowd_k=0.0, lights=1.0)
    with layer(ctx, cam, t):
        gw = Walk(Keys((0, 700), (3, 1100)), 815, es(815), "walk", t1=5)
        gw.draw(ctx, GUS, t, {"a1": (2.6 + 0.3 * math.sin(t * 9), 0.3), "hturn": 0.3, "face": "smile"})
    fx.grade(ctx, "memory", 0.7)
    D.text(ctx, "DAY 1", W - 110, 200, 70, D.FONT_TITLE, hexrgb("#f7eedb"), "right", stroke=D.INK, slw=10)


def shot_excited(ctx, t, S):
    """Гас вываливается из лифта, руки вперёд. Герой — крик."""
    cam = Cam(Keys((0, 960), (2, 1100)), 600, Keys((0, 1.4), (2, 1.6)), shake=lambda t: 0.25)
    with layer(ctx, cam, t):
        bg(ctx, "lobby", (-400, -100, 2800, 1400), lobby)
        M.elevator_doors(ctx, 960, LOBBY_FLOOR, 1.0)
        w = Walk(Keys((0, 960), (2.5, 1250)), LOBBY_FLOOR + 20, 98, "shamble", t1=4)
        w.draw(ctx, GUS_Z, t, {"a1": (1.5 + 0.2 * math.sin(t * 9), -0.2), "a2": (1.4, -0.1), "mouth": 1.0})
        p = R.stand("side", t, 1)
        p.update(face="scream", blink=0, lean=-0.25, a1=(2.7, 0.5), a2=(2.4, 0.6), hturn=0.5)
        HERO.draw(ctx, 1500, LOBBY_FLOOR + 30, 98, -1, p)
        draw_dog(ctx, 1620, LOBBY_FLOOR + 34, 82, -1, dog_pose(t, "stand", bark=1.0))
    fx.grade(ctx, "warm", 0.15)


SK = store_x("SLEEP KINGDOM")


def shot_chase(ctx, t, S):
    """Погоня по галерее: герой, Претцель и Гас."""
    xk = Keys((0, SK - 2400), (3.0, SK + 100, "lin"))
    cam = Cam(lambda t: xk(t) - 150, 560, 1.05)
    gates = {n: 1.0 for n, _, _ in M.STORES}
    gates["SLEEP KINGDOM"] = 0.0
    with layer(ctx, cam, t):
        gallery_bg("d16", "day", 0.9, gates)(ctx)
        hw = Walk(xk, GF + 40, gs(), "run", t1=5)
        hw.draw(ctx, HERO, t, {"face": "scream", "blink": 0})
        draw_dog(ctx, xk(t) + 150, GF + 46, gs() * 0.95, 1, dog_pose(t, "run", phase=t * 3.4))
        gx = lambda tt: xk(tt) - 420 + 60 * math.sin(tt * 2)
        gw = Walk(gx, GF + 40, gs(), "run", t1=5)
        gw.draw(ctx, GUS_Z, t, {"a1": (1.55, -0.2), "a2": (1.45, -0.1), "mouth": 1.0, "neck": 0.25})
    with layer(ctx, cam, t, 1.3):
        gallery_rail(ctx)
    fx.grade(ctx, "warm", 0.12)


def shot_store(ctx, t, S):
    """Через мебельный: прыжок через кровать, выход в подсобку."""
    xk = Keys((0, -100), (1.2, 900, "lin"), (1.6, 1250, "lin"), (2.4, 2120, "lin"))
    jump = lambda t: math.sin(math.pi * clamp((t - 1.15) / 0.5)) * 200 if 1.15 < t < 1.65 else 0
    cam = Cam(lambda t: clamp(xk(t), 700, 1500), 560, 1.0)
    with layer(ctx, cam, t):
        bg(ctx, "bedroom_day", (-400, -100, 2800, 1400), lambda c: ST.bedroom_store(c, 0.9))
        if t < 2.4:
            w = Walk(xk, 900, 95, "run", t1=4)
            w.draw(ctx, HERO, t, {"face": "scared", "blink": 0}, dy=-jump(t))
        draw_dog(ctx, xk(max(0, t - 0.3)) - 60, 906, 82, 1, dog_pose(t, "run", phase=t * 3.4))
        gx = Keys((0, -600), (1.6, 500, "lin"), (2.8, 1250, "lin"), (3.5, 1500))
        gw = Walk(gx, 900, 95, "run", t1=5)
        gw.draw(ctx, GUS_Z, t, {"a1": (1.55, -0.2), "a2": (1.45, -0.1), "mouth": 1.0})
    fx.grade(ctx, "warm", 0.12)


def shot_slam(ctx, t, S):
    """Снаружи: решётка мебельного падает с грохотом. Гас прижат к прутьям."""
    T = 0.5
    frac = smooth(t / T) if t < T else 1.0
    cam = Cam(SK + 280, 560, 1.25, shake=lambda t: shake_k(t, T, 0.5, 1.2))
    gates = {n: 1.0 for n, _, _ in M.STORES}
    gates["SLEEP KINGDOM"] = 0.0
    with layer(ctx, cam, t):
        gallery_bg("d16", "day", 0.9, gates)(ctx)
        p = zombie_reach(t, 7)
        p.update(view="front", hturn=0.0, mouth=0.9, h1=(-0.35, -2.3), h2=(0.35, -2.25))
        GUS_Z.draw(ctx, SK + 280, GF - 10, 88, 1, p)
        C.grille(ctx, SK, GF - 470, 560, 470, frac)
        hp = R.stand("side", t, 1)
        hp.update(face="determined", h1=(0.5, -1.0 - 1.2 * (1 - frac)), h2=(0.45, -1.0 - 1.2 * (1 - frac)))
        HERO.draw(ctx, SK + 680, GF + 40, gs(), -1, hp)
        draw_dog(ctx, SK + 820, GF + 46, gs() * 0.95, -1, dog_pose(t, "sit", bark=0.0))
    fx.grade(ctx, "warm", 0.12)


def shot_locked(ctx, t, S):
    """Гас — единственный охранник, которого заперли. Герой отряхивает руки."""
    cam = Cam(Keys((0, SK + 380), (4, SK + 330)), 560, Keys((0, 1.35), (4, 1.15)))
    gates = {n: 1.0 for n, _, _ in M.STORES}
    gates["SLEEP KINGDOM"] = 0.0
    with layer(ctx, cam, t):
        gallery_bg("d16", "day", 0.9, gates)(ctx)
        p = zombie_reach(t, 7)
        p.update(view="front", hturn=0.0, h1=(-0.35, -2.3 - 0.05 * math.sin(t * 6)), h2=(0.35, -2.25))
        GUS_Z.draw(ctx, SK + 280, GF - 10, 88, 1, p)
        C.grille(ctx, SK, GF - 470, 560, 470, 1.0)
        D.rect(ctx, SK + 150, GF - 150, 260, 70, hexrgb("#f6f1e6"), D.INK, 3, wob=0.6)
        D.text(ctx, "SECURITY", SK + 280, GF - 103, 40, D.FONT_TITLE, hexrgb("#c23b33"))
        hp = R.stand("front", t, 1)
        dust = math.sin(t * 14)
        hp.update(face="smile", h1=(-0.1 + 0.08 * dust, -1.6), h2=(0.1 - 0.08 * dust, -1.6), hturn=-0.5)
        HERO.draw(ctx, SK + 720, GF + 40, gs(), 1, hp)
        draw_dog(ctx, SK + 860, GF + 46, gs() * 0.95, -1, dog_pose(t, "sit"))
    fx.grade(ctx, "warm", 0.12)


def build(S):
    c = S.cue
    S.shots = [
        Shot(0, shot_button),
        Shot(c(1) - 0.1, shot_doors),
        Shot(c(2) - 0.1, shot_memory_gus, "white", 0.3),
        Shot(c(3) - 0.1, shot_excited, "white", 0.2),
        Shot(c(4) - 0.1, shot_chase),
        Shot(c(4) + 2.4, shot_store),
        Shot(c(5) - 0.9, shot_slam),
        Shot(c(5) + 0.6, shot_locked),
    ]
    S.sfx += [(c(0, True) - 0.5, "ding", 1.0), (c(5) - 0.9 + 0.5, "gate_slam", 1.2)]
