"""День 8: кольцеброс в аркаде. Всё лето ты пытался выиграть гигантского радужного единорога для сестры Лили —
обещал. Сегодня никто не мешает тренироваться: двести колец — и он твой. Он выше тебя. Осталось донести домой."""
from scenes.kit import *
from scenes.shared import *

BX0, BX1 = 850, 2250                 # стойка кольцеброса (arcade x0 = -600)
TOP = IN.FL - 300                    # верх стойки


def bottle_x(k):
    return BX0 + 160 + (k % 3) * 120 + (k // 3) * 420


def arcade_back(ctx, t, cam, lit=True, prize=True, tint=None):
    room_back(ctx, t, cam, "arcade_%d_%d" % (lit, prize),
              lambda c: IN.arcade(c, "day", lit=lit, t=0.0, prize=prize), (-600, -900, 4200, 2700), 0.6)


def ring(ctx, x, y, s=1.0, c="#e8423c", tilt=0.25):
    """Кольцо в полёте/лежит: эллипс, сплющенный по наклону."""
    D.ellipse(ctx, x, y, 34 * s, 34 * s * tilt, None, D.INK, 9 * s)
    D.ellipse(ctx, x, y, 34 * s, 34 * s * tilt, None, hexrgb(c), 5 * s)


def shot_arcade(ctx, t, S):
    """Тео (без головы костюма) входит в пустую аркаду; камера ведёт к единорогу на крючке."""
    d = S.cue(1) - 0.1
    w = Walk(Keys((0, -250), (d * 0.7, 900, "io")), IN.FL + 60, 112, "walk", t1=d + 1)
    cam = Cam(Keys((0, 960), (d * 0.3, 960), (d, 2130, "io")), 420, Keys((0, 0.62), (d, 0.66)))
    arcade_back(ctx, t, cam)
    with layer(ctx, cam, t):
        x = w.x(t)
        p = w.pose(t, dict(face="happy", hturn=0.5 * smooth(clamp((t - d * 0.6) / 0.5))))
        THEO_FUR.draw(ctx, x, IN.FL + 60, 112, 1, p)
        bx = lerp(-500, 650, smooth(clamp(t / (d * 0.8))))
        draw_raccoon(ctx, bx, IN.FL + 80, 105, 1, raccoon_pose(t, "walk", phase=t * 2.2) if t < d * 0.8
                     else raccoon_pose(t, "sit", look=0.4))
    if t > d * 0.55:
        pop_text(ctx, "RING TOSS", W / 2 - 300, 230, t, d * 0.55, 90, "#ffd23a", dur=d, shake=False)


def shot_promise(ctx, t, S):
    """Флешбэк «прошлым летом»: Лили показывает на единорога, кольцо отскакивает; мизинчики — обещание."""
    d = S.cue(2) - S.cue(1)
    T_PROM = d * 0.48
    if t < T_PROM:
        cam = Cam(2450, 400, Keys((0, 0.85), (T_PROM, 0.88)))
    else:
        cam = Cam(2600, 560, Keys((0, 1.25), (d, 1.35)))
    arcade_back(ctx, t, cam)
    with layer(ctx, cam, t):
        # живые посетители на фоне
        for i in range(3):
            L = living_look(880 + i, ("mom", "dad", "teen")[i])
            pv = R.stand("side", t, i)
            R.Fig(L).draw(ctx, 1450 + i * 230, IN.FL + 10, 104, 1 if i != 1 else -1, pv)
        lx = 2480
        if t < T_PROM:
            # Лили тянется к единорогу; Тео бросает — БОИНГ
            pl = R.stand("side", t, 3)
            pl.update(face="happy", h1=(0.9, -3.9 + 0.1 * math.sin(t * 8)), h2=(0.3, -1.7), look=(1, -0.6),
                      hturn=0.4)
            LILY.draw(ctx, lx, IN.FL + 80, 112, 1, pl)
            u = clamp((t - 0.6) / 0.9)
            pt = R.stand("side", t, 1)
            pt.update(face="neutral" if u < 1 else "sad", h1=(lerp(0.0, 1.0, smooth(min(1, u * 3))), -2.6),
                      h2=(0.3, -1.7))
            THEO.draw(ctx, 2200, IN.FL + 80, 112, -1, pt)
            if 0 < u < 1:
                tx, ty = bottle_x(7), TOP - 150
                rx = lerp(2110, tx, u)
                ry = lerp(IN.FL - 210, ty, u) - math.sin(u * math.pi) * 260
                if u > 0.75:
                    k = (u - 0.75) / 0.25
                    rx, ry = tx - 160 * k, ty - 90 * math.sin(k * math.pi) + 120 * k * k
                ring(ctx, rx, ry, 1.0, "#2f8fd8", 0.3 + 0.2 * math.sin(u * 20))
        else:
            # мизинчиковое обещание: Тео наклоняется к сестре
            tt = t - T_PROM
            pl = R.stand("side", tt, 3)
            pl.update(face="sad" if tt < 0.6 else "happy", h1=(0.7, -2.6), h2=(0.2, -1.6), look=(1, -0.5))
            JL = LILY.draw(ctx, 2480, IN.FL + 80, 112, 1, pl)
            hx, hy = LILY.world(2480, IN.FL + 80, 112, 1, JL["hand1"])
            pt = R.stand("side", tt, 1)
            pt.update(face="smile", lean=0.28, neck=0.2, h2=(0.3, -1.6),
                      h1=((2700 - hx) / 112, (hy - (IN.FL + 80)) / 112))
            THEO.draw(ctx, 2700, IN.FL + 80, 112, -1, pt)
            if tt > 0.5:
                heart(ctx, hx, hy - 90 - 30 * smooth(clamp((tt - 0.5) / 0.6)), 34)
    # сепия и виньетка воспоминания
    memory_tint(ctx)
    place_tag(ctx, "LAST SUMMER", t, 70, 210, "#fff6d8", "#8a5a34")
    if t > T_PROM + 0.4:
        speech(ctx, 1450, 230, "I PROMISE.", t, T_PROM + 0.4, 70, tail=(-1, 1))
    elif t > 1.5:
        pop_text(ctx, "BOING", W / 2 - 80, 420, t, 1.5, 90, "#9fe0ff", dur=0.8)


def shot_practice(ctx, t, S):
    """Тренировка: кольца летят и отскакивают, счётчик бежит до 200; последнее — дзынь, на горлышке."""
    d = S.cue(3) - S.cue(2)
    T_WIN = d * 0.62
    T_LAND = T_WIN + 1.0
    n_thrown = int(199 * clamp(t / T_WIN) ** 1.6) + (1 if t > T_WIN else 0)
    cam = Cam(Keys((0, 1300), (T_WIN, 1300), (T_LAND, 1400, "io")), 470,
              Keys((0, 0.92), (T_WIN, 0.95), (T_LAND, 1.1, "io"), (d, 1.12)))
    arcade_back(ctx, t, cam, prize=True)
    with layer(ctx, cam, t):
        # гора колец на стойке растёт
        r = rng(8)
        for k in range(min(60, n_thrown // 3)):
            rx = BX0 + 60 + r.uniform(0, BX1 - BX0 - 120)
            ring(ctx, rx, TOP - 6 - r.uniform(0, 14), 0.8, PK.BRIGHT[k % 8], 0.28)
        # бросок: период сокращается (ускоренная перемотка)
        tgt = bottle_x(4)
        win = t > T_WIN
        if not win:
            P = lerp(0.9, 0.22, clamp(t / T_WIN))
            u = (t % P) / P
            arm = (lerp(-0.1, 1.0, smooth(clamp((u - 0.25) / 0.2))), lerp(-2.3, -2.9, smooth(clamp((u - 0.25) / 0.2))))
            if u < 0.25:
                arm = (lerp(1.0, -0.1, smooth(u / 0.25)), lerp(-2.9, -2.3, smooth(u / 0.25)))
            face = "worried"
        else:
            u = 0.0
            tl = t - T_LAND
            arm = (1.0, -2.9) if tl < 0 else (0.5, -4.0)
            face = "neutral" if tl < 0 else "laugh"
        pt = R.stand("side", t, 1)
        jump = 0.0
        if win and t > T_LAND + 0.2:
            jump = abs(math.sin((t - T_LAND - 0.2) * 6)) * 60
        pt.update(face=face, h1=arm, h2=(0.3, -1.7) if not (win and t > T_LAND) else (-0.4, -4.0), hturn=0.3)
        THEO_FUR.draw(ctx, 680, IN.FL + 90 - jump, 112, 1, pt)
        if not win and u > 0.45:
            k = (u - 0.45) / 0.55
            bx = bottle_x(3 + int(t * 7) % 6)
            rx = lerp(790, bx, k)
            ry = lerp(IN.FL - 240, TOP - 150, k) - math.sin(k * math.pi) * 180
            ring(ctx, rx, ry, 1.2, PK.BRIGHT[int(t / 0.3) % 8], 0.3)
        if win:
            # последнее кольцо: замедленно, вращаясь, садится на горлышко
            k = clamp((t - T_WIN) / (T_LAND - T_WIN))
            rx = lerp(790, tgt, k)
            ry = lerp(IN.FL - 240, TOP - 120, k ** 0.9) - math.sin(k * math.pi) * 240
            ring(ctx, rx, ry, 1.2, "#ffd23a", 0.3 + 0.25 * math.sin(k * 14) if k < 1 else 0.3)
        draw_raccoon(ctx, 420, IN.FL + 100, 105, 1, raccoon_pose(t, "sit", look=-0.2 + 0.4 * clamp(t / d)))
    counter_badge(ctx, "RINGS", min(200, max(1, n_thrown)), W - 300, 160, "#ffd23a", 420)
    if win and t > T_LAND:
        if int((t - T_LAND) * 6) % 2 == 0:
            D.rect(ctx, 0, 0, W, H, hexrgb("#fff2a0"), None, 0, wob=0, alpha=0.12)
        pop_text(ctx, "DING DING DING!", W / 2, 230, t, T_LAND, 100, "#ffd23a", dur=d, shake=True)
    elif win:
        pop_text(ctx, "#200...", W / 2 - 200, 260, t, T_WIN, 90, "#fff6d8", dur=T_LAND - T_WIN, shake=False)


def shot_carry(ctx, t, S):
    """Он выше тебя: мерка роста. Потом несёшь его над головой, шатаясь; Бандит едет на спине."""
    d = S.dur - S.cue(3)
    T_CARRY = d * 0.42
    if t < T_CARRY:
        cam = Cam(1700, 520, Keys((0, 1.0), (T_CARRY, 1.06)))
        arcade_back(ctx, t, cam, prize=False)
        with layer(ctx, cam, t):
            IN.unicorn(ctx, 1900, IN.FL + 70, 0.7, "day", -1, t)
            p = R.stand("side", t, 1)
            p.update(face="shock" if t < T_CARRY * 0.5 else "happy", look=(1, -0.8), hturn=0.3, h1=(0.4, -1.8))
            J = THEO_FUR.draw(ctx, 1350, IN.FL + 70, 112, 1, p)
            draw_raccoon(ctx, 1150, IN.FL + 80, 105, 1, raccoon_pose(t, "sit", look=0.6))
            # мерка: две пунктирные линии
            ytheo = THEO_FUR.world(1350, IN.FL + 70, 112, 1, J["head"])[1] - 70
            yuni = IN.FL + 70 - 0.7 * 940
            k = smooth(clamp((t - 0.4) / 0.4))
            for yy, lab, c in ((ytheo, "YOU", "#9fe0ff"), (yuni, "IT", "#f05a8a")):
                x = 1150
                while x < 1150 + 1100 * k:
                    D.line(ctx, x, yy, x + 30, yy, hexrgb(c), 6)
                    x += 50
                if k > 0.9:
                    D.text(ctx, lab, 2280, yy + 18, 50, D.FONT_TITLE, hexrgb(c), stroke=D.INK, slw=5)
        pop_text(ctx, "TALLER THAN YOU", W / 2 - 300, 170, t, 0.9, 80, "#ffd23a", dur=T_CARRY, shake=False)
        return
    tt = t - T_CARRY
    dd = d - T_CARRY
    w = Walk(Keys((0, 2600), (dd, 1300, "lin")), IN.FL + 80, 112, "walk", t1=dd + 1)
    cam = Cam(lambda q: w.x(q - T_CARRY) - 80, 400, 0.8)
    arcade_back(ctx, t, cam, prize=False)
    with layer(ctx, cam, t):
        x = w.x(tt)
        wob = 0.12 * math.sin(tt * 3.1) + 0.05 * math.sin(tt * 7.3)
        p = w.pose(tt, dict(face="worried", h1=(0.45, -4.1), h2=(0.25, -4.15), mouth=0.3,
                            lean=0.04 * math.sin(tt * 3.1)))
        J = THEO_FUR.draw(ctx, x, IN.FL + 80, 112, -1, p)
        hx, hy = THEO_FUR.world(x, IN.FL + 80, 112, -1, J["hand1"])
        ctx.save()
        ctx.translate(hx, hy + 6)
        ctx.rotate(wob)
        IN.unicorn(ctx, 0, 0, 0.7, "day", -1, t)
        draw_raccoon(ctx, 20, -0.7 * 525, 100, -1, raccoon_pose(tt, "sit", look=0.2 * math.sin(tt * 2)))
        ctx.restore()
    if tt > 0.4:
        pop_text(ctx, "WOBBLE", W / 2 + 380, 520, tt, 0.4, 70, "#fff6d8", dur=1.0)
    if tt > dd * 0.45:
        pop_text(ctx, "NOW... GET IT HOME.", W / 2 + 420, 620, tt, dd * 0.45, 76, "#ffd23a", dur=dd, shake=False)


def build(S):
    c = S.cue
    S.shots = [
        Shot(0, shot_arcade, "fade", 0.4),
        Shot(c(1) - 0.1, shot_promise, "white", 0.3),
        Shot(c(2) - 0.1, shot_practice, "white", 0.3),
        Shot(c(3) - 0.1, shot_carry, "fade", 0.3),
    ]
    S.tods = [(0, "day")]
    S.sfx += [(c(1) + 1.5, "jump_boing", 0.6), (c(2) + 0.3, "whoosh", 0.4),
              (c(2) + (c(3) - c(2)) * 0.62 + 1.0, "ding", 1.0), (c(2) + (c(3) - c(2)) * 0.62 + 1.1, "kids_laugh", 0.4),
              (c(3) + 0.4, "pop", 0.6)]
    S.music = [(0, "fun", 0.8), (c(1), "warm", 0.8), (c(2), "fun", 0.9), (c(3), "comic", 0.8)]
