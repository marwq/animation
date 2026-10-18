"""День 4: правило второе — случайно. Бандит прыгает на пульт, карусель играет музыку. Все головы
поворачиваются, сотни вваливаются на крутящийся круг. Они идут на музыку. Триста зомби катаются по кругу."""
from scenes.kit import *
from scenes.shared import *

CX = 1500           # центр карусели (мир)
CGY = PK.FL + 500   # «земля» карусели
PANEL_X = 3050      # пульт оператора


def panel(ctx, x, gy, on=0.0, press=0.0, t=0.0):
    """Пульт карусели на стойке: большие кнопки, рычаг, табличка."""
    D.rect(ctx, x - 20, gy - 330, 40, 330, hexrgb("#5a606c"), D.INK, 3, wob=0)
    D.poly(ctx, [(x - 150, gy - 330), (x + 150, gy - 330), (x + 130, gy - 430), (x - 130, gy - 430)],
           hexrgb("#2f6fd0"), D.INK, 4, wob=0)
    for k, c in enumerate(("#4cff8a", "#ff4a3a", "#ffd23a")):
        bx = x - 80 + k * 80
        down = 6 * press if k == 0 else 0
        D.circle(ctx, bx, gy - 385 + down, 24, hexrgb(c) if (k != 0 or on > 0) else shade(hexrgb(c), -0.4), D.INK, 3)
    D.rrect(ctx, x - 110, gy - 300, 220, 60, 10, hexrgb("#fbfaf6"), D.INK, 3)
    D.text(ctx, "MUSIC", x, gy - 258, 34, D.FONT_TITLE, hexrgb("#2f6fd0"))


def carousel_scene(ctx, t, cam, run, music, ang, standers=None, n_stand=0, riders=None):
    grass_back(ctx, t, cam, "day", -3000, 7000, sun=(4000, -1300, 110))
    with layer(ctx, cam, t):
        PK.flower_bed(ctx, CX - 1100, CGY - 280, 420, "day")
        PK.bench(ctx, PANEL_X + 420, CGY - 200, 1.0, "day")
        RD.carousel(ctx, CX, CGY, 1.0, ang, t, "day", run=run, music=music, riders=riders, standers=standers,
                    n_stand=n_stand, lights=run > 0)


def shot_accident(ctx, t, S):
    """Раскал отдыхает у карусели, Бандит обнюхивает пульт."""
    d = S.cue(1) - 0.1
    cam = Cam(2250, 600, 0.62)
    carousel_scene(ctx, t, cam, 0.0, 0.0, 0.3)
    with layer(ctx, cam, t):
        panel(ctx, PANEL_X, CGY - 200)
        p = sit_pose(t, 1, "neutral")
        p.update(h1=(0.6, -1.9), h2=(0.5, -1.8))
        RASCAL.draw(ctx, PANEL_X + 420, CGY - 200, 112, -1, rascal_pose(p, "calm"))
        draw_raccoon(ctx, PANEL_X + 120, CGY - 200, 105, -1, raccoon_pose(t, "sit", look=-0.6 + 0.2 * math.sin(t * 3)))
    pop_text(ctx, "RULE #2?", W / 2, 200, t, 0.3, 90, "#fff6d8", dur=d, shake=False)


def shot_jump(ctx, t, S):
    """Прыжок на пульт — кнопка — свет и музыка."""
    d = S.cue(2) - S.cue(1)
    T_JUMP, T_ON = 0.3, 0.75
    on = 1.0 if t > T_ON else 0.0
    cam = Cam(Keys((0, PANEL_X + 160), (T_ON, PANEL_X + 160), (d, PANEL_X - 600, "io")), Keys((0, CGY - 520), (d, CGY - 560)),
              Keys((0, 1.6), (T_ON, 1.6), (d, 0.85, "io")))
    carousel_scene(ctx, t, cam, on, on, 0.3 + max(0.0, t - T_ON) * 0.5 * smooth(clamp((t - T_ON) / 1.0)))
    with layer(ctx, cam, t):
        k = clamp((t - T_JUMP) / (T_ON - T_JUMP))
        panel(ctx, PANEL_X, CGY - 200, on, 1.0 if t > T_ON - 0.05 else 0.0, t)
        x = lerp(PANEL_X + 120, PANEL_X - 75, k)
        y = lerp(CGY - 200, CGY - 600, k) - math.sin(k * math.pi) * 160
        if 0 < k < 1:
            draw_raccoon(ctx, x, y, 105, -1, raccoon_pose(t, "jump", jump=k))
        elif k >= 1:
            draw_raccoon(ctx, PANEL_X - 75, CGY - 600, 105, -1, raccoon_pose(t, "stand"))
        else:
            draw_raccoon(ctx, PANEL_X + 120, CGY - 200, 105, -1, raccoon_pose(t, "sit", look=-0.4))
        p = sit_pose(t, 1, "neutral")
        p.update(h1=(0.6, -1.9) if t < T_ON else (1.15, -2.55), h2=(0.5, -1.8))
        RASCAL.draw(ctx, PANEL_X + 420, CGY - 200, 112, -1, rascal_pose(p, "calm" if t < T_ON else "scared"))
    if t > T_ON:
        pop_text(ctx, "CLICK.", W / 2 - 200, 260, t, T_ON, 100, "#fff6d8", dur=0.9)
        pop_text(ctx, "OOM-PAH-PAH", W / 2 + 280, 200, t, T_ON + 0.6, 80, "#ffd23a", dur=d, shake=False)


def shot_turn(ctx, t, S):
    """Головы поворачиваются; толпа тянется к карусели."""
    d = S.cue(3) - S.cue(2)
    T_TURN = 0.5
    if t < d * 0.35:
        D.vgrad(ctx, 0, 0, W, H, [(0, "#6cc4f4"), (1, "#c8efff")])
        r = rng(4)
        for i in range(7):
            x = 150 + i * 270
            turn = smooth(clamp((t - T_TURN - i * 0.08) / 0.25))
            L = R.park_zombie(4000 + i)
            D.rect(ctx, x - 110, 760, 220, 400, L.body, D.INK, 5, wob=0)
            R.Fig(L).head_only(ctx, x, 620, 230, -1 if turn > 0.5 else 1,
                               {"view": "side", "hturn": lerp(0.0, 0.9, turn), "mouth": 0.3 + 0.5 * turn,
                                "neck_line": False, "blink": 0})
        if t > T_TURN:
            for j in range(4):
                ph = (t * 0.8 + j / 4) % 1
                RD.note(ctx, W - 100 - ph * 500, 300 + j * 60, 1.4, PK.BRIGHT[j], 1 - ph, j % 2 == 0)
        return
    tt = t - d * 0.35
    cam = Cam(CX + 300, CGY - 700, 0.42)
    carousel_scene(ctx, t, cam, 1.0, 1.0, t * 0.5)
    with layer(ctx, cam, t):
        r = rng(7)
        for i in range(40):
            sx = r.choice([-1, 1]) * r.uniform(1200, 3000) + CX
            sy = CGY + r.uniform(-260, 260)
            k = clamp(tt / (d * 0.65) * r.uniform(0.6, 1.0))
            x = lerp(sx, CX + (sx - CX) * 0.45, k)
            f = -1 if sx > CX else 1
            p = R.gait(tt * 1.6 + i * 0.3, "shamble", "side", i)
            p.update(a1=(1.5, -0.2), a2=(1.3, -0.1))
            R.Fig(R.park_zombie(4100 + i)).draw(ctx, x, sy, floor_s(sy, CGY, 105), f, p)
    pop_text(ctx, "STUMBLE", W / 2 - 400, 260, tt, 0.2, 80, "#9fc86a", dur=d, shake=False)


def shot_round(ctx, t, S):
    d = S.dur - S.cue(3)
    T_SPIN = d * 0.35
    if t < T_SPIN:
        D.vgrad(ctx, 0, 0, W, H, [(0, "#2a2448"), (1, "#141030")])
        rule_card(ctx, t, 2, ["They follow", "MUSIC."], 0.0)
        return
    tt = t - T_SPIN
    cam = Cam(CX + 250, CGY - 520, Keys((0, 0.72), (d - T_SPIN, 0.8)))

    def riders(c, i, hx, hy, hs, f, front):
        p = sit_pose(tt, i, "neutral")
        p.update(f1=(0.5, 0.3), f2=(0.42, 0.3), a1=(1.3, 0.1), a2=(1.1, 0.1), mouth=0.7, lean=0.15)
        R.Fig(R.park_zombie(4200 + i)).draw(c, hx - f * 10 * hs, hy + 120 * hs, 80 * hs, f, p)

    def standers(c, j, px, py, depth, f):
        p = zombie_idle(tt, j)
        p.update(lean=0.12 + 0.1 * math.sin(tt * 3 + j), a1=(0.9, -0.1), a2=(0.7, 0.0))
        R.Fig(R.park_zombie(4300 + j)).draw(c, px, py, 92 * (0.92 + 0.12 * depth), f, p)

    carousel_scene(ctx, t, cam, 1.0, 1.0, tt * 1.1, standers, 16, riders)
    with layer(ctx, cam, t):
        p = sit_pose(t, 1, "laugh")
        p.update(h1=(0.6, -1.9), h2=(0.5, -1.8), lean=0.05 * math.sin(t * 9))
        RASCAL.draw(ctx, PANEL_X + 420, CGY - 200, 112, -1, rascal_pose(p, "happy"))
        draw_raccoon(ctx, PANEL_X + 200, CGY - 200, 105, -1, raccoon_pose(t, "sit", look=0.3))
    counter_badge(ctx, "RIDING", 300, W - 300, 160, "#9fc86a", 420)
    pop_text(ctx, "ROUND AND ROUND", 520, 230, tt, 0.4, 76, "#ffd23a", dur=d, shake=False)


def build(S):
    c = S.cue
    S.shots = [
        Shot(0, shot_accident, "fade", 0.4),
        Shot(c(1) - 0.1, shot_jump, "fade", 0.25),
        Shot(c(2) - 0.1, shot_turn, "whip", 0.25),
        Shot(c(3) - 0.1, shot_round, "fade", 0.3),
    ]
    S.tods = [(0, "day")]
    S.sfx += [(c(1) + 0.3, "jump_boing", 0.8), (c(1) + 0.75, "click", 1.0), (c(1) + 0.8, "carousel", 1.0),
              (c(2) + 0.5, "zombie_groan", 0.9), (c(2) + 1.5, "shuffle", 0.9), (c(3) + 0.1, "stamp", 0.9)]
    S.music = [(0, "comic", 0.7), (c(1) + 0.75, "carnival", 1.0)]
