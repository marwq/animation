"""День 20: «LAST FLIGHTS IN 10 DAYS». Идея: 30 баллонов гелия — отправить записку им."""
from scenes.kit import *
from scenes.shared import binocular, rosa_window_close, window_view
from sets import stores as ST


def shot_bad(ctx, t, S):
    def scene(c):
        p = R.stand("front", t, 4)
        p.update(h1=(-0.8, -2.9), h2=(0.8, -2.9), face="sad")
        rosa_window_close(c, t, "night", sign=["LAST FLIGHTS", "IN 10 DAYS!"], sign_k=clamp(t / 0.3),
                          pose_fn=lambda tt: p, light=0.7)
    binocular(ctx, scene, t)
    fx.grade(ctx, "night", 0.3)


def shot_pace(ctx, t, S):
    """Ходит туда-сюда перед окном. Счётчик 10."""
    xk = Keys((0, 500), (1.6, 1400), (3.2, 500), (4.8, 1400))
    cam = Cam(960, 540, 1.0)
    window_view(ctx, t, cam, "night", 0.7)
    w = Walk(xk, H + 80, 300, "walk", t1=7)
    p = w.pose(t)
    p["view"] = "side"
    HERO.draw(ctx, xk(t), H + 380, 300, w.facing(t), p, alpha=0.95)
    fx.grade(ctx, "night", 0.5)
    D.text(ctx, "10", W - 140, 220, 180, D.FONT_TITLE, hexrgb("#d9483b"), "right", stroke=D.INK, slw=14)
    D.text(ctx, "DAYS LEFT", W - 140, 290, 50, D.FONT_TITLE, hexrgb("#f7eedb"), "right", stroke=D.INK, slw=8)


def shot_idea(ctx, t, S):
    """Озарение: лампочка над головой."""
    cam = Cam(960, 560, Keys((0, 1.0), (2, 1.12)))
    with layer(ctx, cam, t):
        D.col(ctx, hexrgb("#2a2838"))
        ctx.paint()
        k = clamp((t - 0.5) / 0.2)
        p = {"view": "front", "face": "shock" if k > 0 else "worried", "hturn": 0.0, "neck_line": True, "blink": 0,
             "look": (0, -0.6) if k > 0 else (0, 0)}
        HERO.head_only(ctx, 960, 620, 330, 1, p)
        if k > 0:
            sc = ease_out_back(k)
            ctx.save()
            ctx.translate(960, 210)
            ctx.scale(sc, sc)
            fx.glow(ctx, 0, 0, 220, "#fff2a0", 0.6)
            D.circle(ctx, 0, 0, 70, hexrgb("#ffe27a"), D.INK, 5)
            D.rect(ctx, -30, 60, 60, 50, hexrgb("#9a9da2"), D.INK, 4, wob=0)
            for a in range(8):
                ang = a * TAU / 8
                D.line(ctx, math.cos(ang) * 95, math.sin(ang) * 95, math.cos(ang) * 130, math.sin(ang) * 130,
                       hexrgb("#ffe27a"), 8)
            ctx.restore()
    fx.grade(ctx, "night", 0.2)


def party_bg(c):
    ST.party_store(c)
    for k in range(10):
        ST.helium_tank(c, 160 + k * 170, 860, 1.0)


def shot_tanks(ctx, t, S):
    cam = Cam(Keys((0, 400), (4, 1500)), 600, 1.15)
    with layer(ctx, cam, t):
        bg(ctx, "party", (-400, -100, 2800, 1400), party_bg)
    fx.darkness(ctx, 0.45, [fx.Light(*cam.to_screen(t, 960, 500), 1100, power=0.7, glow_a=0.05)])
    D.text(ctx, "30 TANKS", W / 2, 230, 100, D.FONT_TITLE, hexrgb("#f7eedb"), stroke=D.INK, slw=12,
           alpha=clamp((t - 0.4) / 0.3))
    D.text(ctx, "OF HELIUM", W / 2, 330, 70, D.FONT_TITLE, hexrgb("#f7eedb"), stroke=D.INK, slw=10,
           alpha=clamp((t - 0.7) / 0.3))


def shot_plan(ctx, t, S):
    """Схема: крыша → шарик с запиской летит к вертолётам."""
    D.col(ctx, hexrgb("#f3e7d0"))
    ctx.paint()
    D.text(ctx, "THE PLAN", W / 2, 150, 70, D.FONT_TITLE, D.INK)
    D.rect(ctx, 200, 820, 500, 120, hexrgb("#b9b2a4"), D.INK, 4)
    D.text(ctx, "LIBERTY MALL", 450, 900, 40, D.FONT_TITLE, D.INK)
    from scenes.d12 import heli_far
    heli_far(ctx, 1550, 330, 0.9, t, light=False)
    k = clamp(t / 2.5)
    path = [(450, 780), (800, 600), (1150, 470), (1450, 380)]
    D.col(ctx, D.INK)
    ctx.set_dash([18, 14])
    ctx.set_line_width(4)
    ctx.move_to(*path[0])
    for p in path[1:]:
        ctx.line_to(*p)
    ctx.stroke()
    ctx.set_dash([])
    bx = lerp(450, 1420, k)
    by = lerp(760, 400, k) + math.sin(t * 3) * 10
    ST.balloon(ctx, bx, by - 60, 46, "#c23b33", string=90, note=True)
    if t > 2.0:
        D.text(ctx, "SEND IT TO THEM", W / 2 + 200, 720, 70, D.FONT_TITLE, hexrgb("#c23b33"), alpha=clamp((t - 2.0) / 0.3))


def shot_notes(ctx, t, S):
    """Ночь напролёт: стопки записок растут, часы крутятся, Претцель спит."""
    cam = Cam(960, 600, Keys((0, 1.2), (5, 1.0)))
    with layer(ctx, cam, t):
        D.col(ctx, hexrgb("#2a2632"))
        ctx.paint()
        D.rect(ctx, 300, 870, 1320, 40, hexrgb("#8a6a52"), D.INK, 4)
        D.line(ctx, 360, 910, 360, 1100, D.INK, 10)
        D.line(ctx, 1560, 910, 1560, 1100, D.INK, 10)
        n = int(t * 8)
        for k in range(min(n, 60)):
            sx = 1150 + (k // 20) * 120
            D.rect(ctx, sx, 860 - (k % 20) * 7, 100, 8, hexrgb("#f6f1e6"), D.INK, 1.2, wob=0)
        p = R.stand("side", t, 1)
        wr = math.sin(t * 14)
        p.update(k1=(1.6, 1.6), k2=(1.5, 1.5), hip=(0, 0.66), lean=0.35, h1=(1.15 + 0.05 * wr, -1.75), h2=(0.95, -1.7),
                 face="determined", neck=0.35)
        HERO.draw(ctx, 700, 1080, 125, 1, p)
        D.rect(ctx, 860, 852, 160, 20, hexrgb("#f6f1e6"), D.INK, 2, wob=0)
        draw_dog(ctx, 1500, 1085, 100, -1, dog_pose(t, "lie"))
        # настольная лампа
        D.line(ctx, 420, 870, 470, 690, D.INK, 6)
        D.poly(ctx, [(430, 700), (530, 650), (560, 710), (470, 750)], hexrgb("#3f8a84"), D.INK, 3, wob=0)
        # часы на стене
        D.circle(ctx, 1500, 300, 90, hexrgb("#f7eedb"), D.INK, 6)
        a = t * 3
        D.line(ctx, 1500, 300, 1500 + math.cos(a) * 60, 300 + math.sin(a) * 60, D.INK, 5)
        D.line(ctx, 1500, 300, 1500 + math.cos(a / 12) * 40, 300 + math.sin(a / 12) * 40, D.INK, 8)
    fx.darkness(ctx, 0.6, [fx.Light(*cam.to_screen(t, 520, 770), 800, power=0.9, glow="#ffd9a0", glow_a=0.25)])


def build(S):
    c = S.cue
    S.shots = [
        Shot(0, shot_bad),
        Shot(c(1) - 0.1, shot_pace),
        Shot(c(2) - 0.1, shot_idea),
        Shot(c(2) + 1.3, shot_tanks),
        Shot(c(3) - 0.1, shot_plan),
        Shot(c(4) - 0.1, shot_notes),
    ]
