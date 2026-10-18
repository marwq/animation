"""День 18: Анкор пропала — не на мостике, не на трубе, не в джакузи. Она спит на карусели
Бордвока, вокруг зомби. Банка тунца: Анкор бежит. И все остальные тоже. Самая быстрая лестница."""
from scenes.kit import *
from scenes.shared import *
from scenes.d08 import boardwalk_bg, bw_zombies


def stamp(ctx, txt, t, t0, x=W / 2, y=H / 2, c="#e8423c"):
    k = clamp((t - t0) / 0.18)
    if k <= 0:
        return
    sc = 1.8 - 0.8 * ease_out(k)
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(-0.15)
    ctx.scale(sc, sc)
    D.rrect(ctx, -330, -80, 660, 160, 16, None, hexrgb(c), 12, alpha=k)
    D.text(ctx, txt, 0, 34, 96, D.FONT_TITLE, hexrgb(c), alpha=k)
    ctx.restore()


def shot_search(ctx, t, S):
    d = S.cue(1) - 0.1
    seg = d / 3
    i = min(2, int(t / seg))
    tt = t - i * seg
    if i == 0:
        cam = Cam(BR.CHAIR_X + 200, 600, 1.4)
        bridge_back(ctx, tt, cam, "day", 0.0, sun=(1800, 150, 50), battery=46, autopilot=False)
        with layer(ctx, cam, tt):
            p = R.stand("side", tt, 1)
            p.update(face="worried", hturn=0.9, look=(0.5, 0.3))
            LEO_CAP.draw(ctx, BR.CHAIR_X + 330, BR.BF + 40, 120, -1, p)
        stamp(ctx, "NOT HERE", tt, seg * 0.5)
    elif i == 1:
        cam = Cam(1000, 450, 1.2)
        sea_back(ctx, tt, cam, "day", sun=(1700, 200, 60), hy=900, p=0.2)
        with layer(ctx, cam, tt):
            bg(ctx, "funnel_day", (-500, 0, 3000, 1300), lambda c: OD.funnel_top(c, "day"))
            p = R.stand("side", tt, 1)
            p.update(face="worried", h1=(0.45, -3.2), hturn=0.9)
            LEO_CAP.draw(ctx, 800, OD.FTOP - 20, 105, 1, p)
        stamp(ctx, "NOT HERE", tt, seg * 0.5)
    else:
        cam = Cam((DK.TUB[0] + DK.TUB[1]) / 2, 700, 1.5)
        deck_back(ctx, tt, cam, "day", 0.0, sun=(2400, 0, 60))
        with layer(ctx, cam, tt):
            p = R.stand("side", tt, 1)
            p.update(face="worried", lean=0.4, hturn=0.9)
            LEO_CAP.draw(ctx, DK.TUB[0] - 60, DK.GF + 20, 115, 1, p)
            D.rrect(ctx, DK.TUB[0] + 18, DK.GF - 78, DK.TUB[1] - DK.TUB[0] - 36, 50, 18, hexrgb("#6fe0f0"), D.INK, 3)
        stamp(ctx, "NOT HERE", tt, seg * 0.5)
    for k in range(3):
        D.text(ctx, "?", 300 + k * 90, 300 + math.sin(t * 6 + k) * 20, 130, D.FONT_TITLE, hexrgb("#fff6d8"), stroke=D.INK,
               slw=10)


def carousel_with_cat(ctx, t, cat_awake=False):
    """Карусель с Анкор на лошадке (в мировых координатах Бордвока)."""
    a = (t * 0.5) % 1.0 * TAU
    if math.cos(a) > -0.2:
        px = IN.CAROUSEL_X + math.sin(a) * 440
        up = math.sin(t * 2.2 + 0) * 40
        draw_cat(ctx, px, IN.FL - 20 - 285 + up, 90, 1, cat_pose(t, "sleep" if not cat_awake else "stand"))
        return px, IN.FL - 300 + up
    return None


def shot_found(ctx, t, S):
    cam = Cam(Keys((0, IN.CAROUSEL_X), (4, IN.CAROUSEL_X)), Keys((0, 200), (4, 420)), Keys((0, 0.6), (4, 1.1)))
    boardwalk_bg(ctx, t, cam)
    with layer(ctx, cam, t):
        r = rng(18)
        for i in range(22):
            ang = i / 22 * TAU
            x = IN.CAROUSEL_X + math.cos(ang) * 700
            y = IN.FL + 30 + abs(math.sin(ang)) * 120
            p = zombie_idle(t, i)
            R.Fig(R.zombie_look(2500 + i)).draw(ctx, x, y, 90, 1 if x < IN.CAROUSEL_X else -1, p)
        carousel_with_cat(ctx, t)
    if t > 2.5:
        pop_text(ctx, "SURROUNDED.", W / 2, 230, t, 2.5, 100, "#e8423c", dur=3.0, shake=False)


def shot_tuna(ctx, t, S):
    T_OPEN = 1.2
    D.vgrad(ctx, 0, 0, W, H, [(0, "#2a3a6a"), (1, "#1a2650")])
    k = clamp((t - T_OPEN) / 0.2)
    cx, cy = W / 2, H / 2 + 120
    if k > 0:
        fx.glow(ctx, cx, cy - 60, 600, "#fff2b0", 0.5 * k)
        for i in range(12):
            a = i * TAU / 12 + t * 0.3
            D.line(ctx, cx + math.cos(a) * 180, cy - 60 + math.sin(a) * 180, cx + math.cos(a) * 520,
                   cy - 60 + math.sin(a) * 520, hexrgb("#fff2b0"), 10, 0.35 * k)
    D.ellipse(ctx, cx, cy + 100, 220, 50, hexrgb("#c9d0d4"), D.INK, 6)
    D.rect(ctx, cx - 220, cy - 60, 440, 160, hexrgb("#2f8fd8"), D.INK, 6, wob=0)
    D.text(ctx, "TUNA", cx, cy + 50, 100, D.FONT_TITLE, hexrgb("#fff6d8"))
    D.ellipse(ctx, cx, cy - 60, 220, 50, hexrgb("#e8eef0"), D.INK, 6)
    ring_up = clamp((t - (T_OPEN - 0.4)) / 0.4)
    D.circle(ctx, cx + 120, cy - 60 - 60 * ring_up, 30, None, D.INK, 8)
    if k > 0:
        D.ellipse(ctx, cx, cy - 60, 180, 36, hexrgb("#d9a87a"), D.INK, 3)
    # руки
    D.line(ctx, cx - 520, cy + 300, cx - 200, cy + 30, D.INK, 40)
    D.line(ctx, cx + 520, cy + 300, cx + 150, cy - 70 - 60 * ring_up, D.INK, 40)
    if t > T_OPEN:
        pop_text(ctx, "*CRACK*", cx + 380, 220, t, T_OPEN, 110, "#fff6d8", dur=1.4)


def shot_stampede(ctx, t, S):
    cam = Cam(Keys((0, IN.CAROUSEL_X - 200), (3, 300)), 520, Keys((0, 0.75), (3, 0.7)), shake=0.2)
    boardwalk_bg(ctx, t, cam)
    with layer(ctx, cam, t):
        cx = lerp(IN.CAROUSEL_X, -200, ease_in(clamp(t / 1.6)))
        if t < 0.4:
            carousel_with_cat(ctx, t, cat_awake=True)
        else:
            draw_cat(ctx, cx, IN.FL + 40, 95, -1, cat_pose(t, "run", phase=t * 4))
        r = rng(18)
        for i in range(22):
            ang = i / 22 * TAU
            x0 = IN.CAROUSEL_X + math.cos(ang) * 700
            y = IN.FL + 30 + abs(math.sin(ang)) * 120
            go = clamp((t - 0.6 - (i % 5) * 0.08) / 2.2)
            x = lerp(x0, -400 - (i % 6) * 120, ease_in(go))
            if go > 0:
                p = R.gait(t * 2 + i * 0.3, "run", "side", i)
                p.update(a1=(1.4, -0.1), a2=(1.2, 0), mouth=0.9, lean=0.3)
                R.Fig(R.zombie_look(2500 + i)).draw(ctx, x, y, 90, -1, p)
            else:
                p = zombie_idle(t, i)
                p["hturn"] = -1.0
                R.Fig(R.zombie_look(2500 + i)).draw(ctx, x, y, 90, -1, p)
    motion_lines(ctx, 900, 760, -1, 5, 280, 40, a=0.5)
    pop_text(ctx, "MEOW!", 600, 300, t, 0.2, 110, "#ffe36a", dur=1.2)


def shot_ladder(ctx, t, S):
    prog = 10 * ease_in(clamp(t / 1.4))
    base = 1100
    cam = Cam(960, lambda tt: base - 10 * ease_in(clamp(tt / 1.4)) * 110 - 250, 0.95, shake=0.2)
    deck_back(ctx, t, cam, "day", 1.0, sun=(2400, 0, 60), has_ladder=False)
    with layer(ctx, cam, t):
        DK.ladder(ctx, 960, -300, base, "day", w=80)
        J = draw_climber(ctx, LEO_CAP, 960, base, 110, prog, 1, "back", "scream")
        hy = base - prog * 110
        draw_cat(ctx, 960 + 60, hy - 3.2 * 110, 80, 1, cat_pose(t, "sit"))
        D.ellipse(ctx, 960 + 110, hy - 3.2 * 110 - 10, 26, 10, hexrgb("#d9a87a"), D.INK, 2)
        for i in range(6):
            p = zombie_reach(t, i)
            p.update(a1=(2.6, 0.2), a2=(2.4, 0.3), neck=-0.4, mouth=0.9)
            R.Fig(R.zombie_look(2500 + i)).draw(ctx, 760 + i * 80, base + 20 + (i % 2) * 20, 95, 1 if i % 2 else -1, p)
    speed_lines(ctx, t, n=36, a=0.45)
    if t > 1.5:
        pop_text(ctx, "NEW RECORD", W / 2 + 420, 250, t, 1.5, 80, "#e8423c", dur=2.0)


def build(S):
    c = S.cue
    S.shots = [
        Shot(0, shot_search),
        Shot(c(1) - 0.1, shot_found, "whip", 0.3),
        Shot(c(2) - 0.1, shot_tuna, "fade", 0.25),
        Shot(c(3) - 0.1, shot_stampede),
        Shot(c(4) - 0.1, shot_ladder, "whip", 0.3),
    ]
    S.sfx += [(c(2) + 1.2, "can_open", 1.0), (c(3), "meow", 1.0), (c(3) + 0.6, "stampede", 0.9), (c(4), "climb", 0.9)]
    S.music = "chase"
