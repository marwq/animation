"""День 24: тишина. Разговоры с Претцелем и с Гасом через решётку. Шесть дней. Зелёное небо — шторм."""
from scenes.kit import *
from scenes.shared import atrium_bg, gallery_bg, gs, GF, window_view
from scenes.d16 import SK
from sets import stores as ST


def shot_quiet(ctx, t, S):
    w = Walk(Keys((0, 700), (6, 1200, "lin")), M.AT_LEVELS[0] + 120, 52, "trudge", t1=8)
    cam = Cam(960, Keys((0, 2000), (6, 2100)), Keys((0, 0.62), (6, 0.7)))
    with layer(ctx, cam, t):
        atrium_bg("overcast", 0.0, {})(ctx)
        w.draw(ctx, HERO, t, {"face": "sad"})
        draw_dog(ctx, w.x(t) - 70, M.AT_LEVELS[0] + 124, 45, 1, dog_pose(t, "trot", phase=w.dist(t) * 1.3))
    fx.grade(ctx, "overcast", 0.3)


def shot_talk_gus(ctx, t, S):
    """Сидит на полу у решётки мебельного и говорит. Гас покачивается, «слушает»."""
    cam = Cam(SK + 420, 600, 1.4)
    gates = {n: 1.0 for n, _, _ in M.STORES}
    gates["SLEEP KINGDOM"] = 0.0
    with layer(ctx, cam, t):
        gallery_bg("d16", "day", 0.9, gates)(ctx)
        p = zombie_idle(t, 7, "front")
        p.update(neck=0.15 + 0.12 * math.sin(t * 2.4), htilt=0.2 * math.sin(t * 1.3))
        GUS_Z.draw(ctx, SK + 300, GF - 10, 88, 1, p)
        C.grille(ctx, SK, GF - 470, 560, 470, 1.0)
        hp = R.stand("side", t, 1)
        talk = 0.5 + 0.5 * math.sin(t * 9)
        hp.update(k1=(2.15, 1.85), k2=(2.0, 1.7), hip=(0, 1.5), neck=0.0, h1=(0.75 + 0.2 * math.sin(t * 3), -1.6),
                  h2=(0.7, -1.15), face="smile", mouth=talk * 0.5, hturn=0.7)
        HERO.draw(ctx, SK + 720, GF + 40, gs(), -1, hp)
        draw_dog(ctx, SK + 900, GF + 46, gs() * 0.9, -1, dog_pose(t, "lie"))
    fx.grade(ctx, "overcast", 0.25)
    if t > 1.0:
        D.text(ctx, "GOOD LISTENER", W / 2, 220, 80, D.FONT_TITLE, hexrgb("#f7eedb"), stroke=D.INK, slw=10,
               alpha=clamp((t - 1.0) / 0.3))


def shot_count(ctx, t, S):
    D.col(ctx, hexrgb("#d9cdb5"))
    ctx.paint()
    D.rect(ctx, 460, 120, 1000, 820, hexrgb("#f6f1e6"), D.INK, 5, wob=0.8)
    D.rect(ctx, 460, 120, 1000, 120, hexrgb("#c23b33"), D.INK, 5, wob=0.5)
    D.text(ctx, "30 DAYS", 960, 205, 70, D.FONT_TITLE, hexrgb("#f6f1e6"))
    for i in range(30):
        x = 520 + (i % 7) * 132
        y = 300 + (i // 7) * 125
        D.rect(ctx, x, y, 110, 100, None, D.INK, 2.5, wob=0.4, seed=i)
        D.text(ctx, str(i + 1), x + 20, y + 36, 30, D.FONT_DAY, D.INK, "left", bold=True)
        if i < 24:
            ctx.set_line_width(9)
            D.col(ctx, hexrgb("#c23b33"))
            ctx.move_to(x + 15, y + 15)
            ctx.line_to(x + 95, y + 85)
            ctx.move_to(x + 95, y + 15)
            ctx.line_to(x + 15, y + 85)
            ctx.stroke()
    k = clamp((t - 0.6) / 0.6)
    if k > 0:
        ctx.set_line_width(8)
        D.col(ctx, hexrgb("#1f2a55"))
        ctx.save()
        ctx.translate(1250, 805)
        ctx.scale(1.0, 0.45)
        ctx.arc(0, 0, 330, 0, TAU * k)
        ctx.restore()
        ctx.stroke()
        D.text(ctx, "6 LEFT", 1250, 1020, 80, D.FONT_TITLE, hexrgb("#f7eedb"), stroke=D.INK, slw=10, alpha=k)


def green_sky_view(ctx, t, k):
    """Небо над Нью-Джерси: зелёное, потом чёрное."""
    top = mix(mix(hexrgb("#b7bcbf"), hexrgb("#4a6a48"), clamp(k * 2)), hexrgb("#14161a"), clamp(k * 2 - 1))
    bot = mix(mix(hexrgb("#d9d6cc"), hexrgb("#9aaa6a"), clamp(k * 2)), hexrgb("#2a2e30"), clamp(k * 2 - 1))
    D.vgrad(ctx, -200, -200, 2400, 1500, [(0, top), (1, bot)])
    r = rng(24)
    for i in range(12):
        x = r.uniform(-300, 2200) + t * 60
        y = r.uniform(-100, 400)
        D.col(ctx, mix(top, hexrgb("#0e1012"), 0.3), 0.7)
        for j in range(5):
            ctx.arc(x + (j - 2) * 70, y + (j % 2) * 20, 80 + j * 8, 0, TAU)
            ctx.fill()
    C.skyline(ctx, -200, 2200, 1000, "storm", depth=0, seed=241, hmin=60, hmax=200)
    D.rect(ctx, -200, 1000, 2400, 400, hexrgb("#2a2c34"), None, 0, wob=0)


def shot_sky(ctx, t, S):
    d = S.cue(4) - S.cue(3)
    k = clamp(t / d)
    green_sky_view(ctx, t, k)
    from scenes.shared import window_frame
    window_frame(ctx)
    p = R.stand("back", t, 2)
    HERO.draw(ctx, 1300, H + 330, 240, 1, p)
    if k > 0.7:
        fx.lightning(ctx, 1.0 if 0.75 < k < 0.78 else 0.0)
    D.text(ctx, "NEW JERSEY", W / 2, 200, 60, D.FONT_TITLE, hexrgb("#f7eedb"), stroke=D.INK, slw=8,
           alpha=clamp((t - 0.3) / 0.3) * clamp(2 - t))


def shot_radio(ctx, t, S):
    cam = Cam(960, 600, Keys((0, 1.1), (4, 1.4)))
    with layer(ctx, cam, t):
        ST.electronics(ctx, t, 0.0)
        D.rect(ctx, 700, 410, 520, 300, hexrgb("#1a1a20"), D.INK, 5)
        D.rect(ctx, 715, 425, 490, 270, hexrgb("#c23b33") if int(t * 3) % 2 else hexrgb("#8a2a2a"), None, 0, wob=0)
        D.text(ctx, "STORM", 960, 540, 90, D.FONT_TITLE, hexrgb("#f7eedb"))
        D.text(ctx, "WARNING", 960, 630, 70, D.FONT_TITLE, hexrgb("#f7eedb"))
        ST.radio(ctx, 1450, 860, 1.2, 1.0, t)
        p = R.stand("side", t, 1)
        p.update(face="worried", lean=0.15, hturn=0.6)
        HERO.draw(ctx, 520, 940, 110, 1, p)
        draw_dog(ctx, 680, 944, 90, 1, dog_pose(t, "sit", look=0.2))
    fx.darkness(ctx, 0.6, [fx.Light(*cam.to_screen(t, 960, 560), 700, power=0.85, glow="#ff8a7a", glow_a=0.25)])
    D.text(ctx, "TONIGHT", W / 2, 220, 100, D.FONT_TITLE, hexrgb("#d9483b"), stroke=D.INK, slw=12,
           alpha=clamp((t - 1.5) / 0.3))


def build(S):
    c = S.cue
    S.shots = [
        Shot(0, shot_quiet),
        Shot(c(1) - 0.1, shot_talk_gus),
        Shot(c(2) - 0.1, shot_count),
        Shot(c(3) - 0.1, shot_sky),
        Shot(c(4) - 0.1, shot_radio),
    ]
    S.tods = [(0, "overcast"), (c(3), "storm")]
