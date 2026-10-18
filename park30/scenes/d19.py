"""День 19 (ночь): пробный надув на поле Kiddie Land. Вентилятор, горелка — шар встаёт, огромный, светящийся, в
крыльях дракона и пятнах коровы. Красиво — и это самое яркое и громкое на мили вокруг. Они идут. Клапан — и шар
падает плашмя на тридцать зомби."""
from scenes.kit import *
from scenes.shared import *

FL = PK.FL
BX = 1800                      # корзина (низ)
BS = 0.8                       # масштаб шара и корзины


def fan(ctx, x, gy, t, on=True, s=1.0):
    """Большой вентилятор для надува: рама и лопасти в кожухе."""
    ctx.save()
    ctx.translate(x, gy)
    ctx.scale(s, s)
    D.rect(ctx, -90, -40, 180, 40, hexrgb("#5a606c"), D.INK, 3, wob=0)
    D.circle(ctx, 0, -210, 170, hexrgb("#2b2f3a"), D.INK, 5)
    a0 = t * 30 if on else 0.3
    for k in range(4):
        a = a0 + k * TAU / 4
        D.ellipse(ctx, math.cos(a) * 80, -210 + math.sin(a) * 80, 70, 26, hexrgb("#c9d0d6"), D.INK, 2,
                  rot=a)
    D.circle(ctx, 0, -210, 30, hexrgb("#e8423c"), D.INK, 3)
    for k in range(6):
        D.line(ctx, -170 + k * 68, -380, -170 + k * 68, -40, hexrgb("#8f99a3"), 3, 0.7)
    ctx.restore()


def rig(ctx, t, ang, fill, burner=0.0, glow=0.0, tod="night", flat=0.0):
    """Корзина + оболочка как одно целое, повёрнутое вокруг нижнего правого угла корзины на ang
    (0 — стоит; +π/2 — лежит макушкой вправо). flat — сплющивание при падении."""
    w = 360 * BS
    px, py = BX - w / 2, FL + 30
    ctx.save()
    ctx.translate(px, py)
    ctx.rotate(ang)
    ctx.translate(-px, -py)
    info = BL.basket(ctx, BX, FL + 30, BS, tod, burner, t, tanks=2)
    ctx.save()
    if flat > 0:
        ctx.translate(BX, info["frame"])
        ctx.scale(1.0, 1.0 - 0.75 * flat)
        ctx.translate(-BX, -info["frame"])
    e = BL.envelope(ctx, BX, info["frame"], BS, fill, tod, 0.0, None, glow, t, wobble=0.05 * (1 - fill))
    ctx.restore()
    for k in (-1, 1):
        D.line(ctx, BX + k * 70 * BS, info["frame"], e["left" if k < 0 else "right"][0],
               e["left" if k < 0 else "right"][1], D.INK, 3)
    ctx.restore()


def field_back(ctx, t, cam, beam=0.0):
    sky_back(ctx, t, cam, "night", -4000, 8000, moon=(-600, -500, 100))
    with layer(ctx, cam, t):
        PK.plaza(ctx, "night", -4000, 8000, c="#4a7a4a")
        RD.kiddie_slide(ctx, -500, FL + 20, 1.6, "night")
        PK.fence(ctx, -1500, 5200, FL - 40, 160, "night")
        D.rrect(ctx, 3500, FL - 520, 560, 120, 20, hexrgb("#ffd23a"), D.INK, 4)
        D.text(ctx, "KIDDIE LAND", 3780, FL - 440, 62, D.FONT_TITLE, hexrgb("#e8423c"))
        D.line(ctx, 3600, FL - 400, 3600, FL - 40, D.INK, 10)
        D.line(ctx, 3960, FL - 400, 3960, FL - 40, D.INK, 10)


def shot_field(ctx, t, S):
    """Ночью на поле: оболочка разложена, корзина на боку, вентилятор, Раскал с фонариком."""
    d = S.cue(1) - 0.1
    cam = Cam(Keys((0, 1400), (d, 2100)), FL - 380, Keys((0, 0.48), (d, 0.52)), anchor=(1800, 520))
    field_back(ctx, t, cam)
    with layer(ctx, cam, t):
        rig(ctx, t, math.pi / 2, 0.15)
        fan(ctx, BX - 520, FL + 60, t, on=False)
        p = R.stand("side", t, 1)
        p.update(h1=(0.9, -2.6), h2=(0.3, -1.7))
        J = RASCAL_PATCH.draw(ctx, BX - 820, FL + 80, 112, 1, rascal_pose(p, "calm"))
        hx, hy = RASCAL_PATCH.world(BX - 820, FL + 80, 112, 1, J["hand1"])
        D.rrect(ctx, hx - 16, hy - 20, 50, 30, 10, hexrgb("#ffd23a"), D.INK, 2)
        D.poly(ctx, [(hx + 34, hy - 18), (hx + 34, hy + 8), (hx + 700, hy + 160), (hx + 700, hy - 140)],
               hexrgb("#fff2a0"), None, 0, wob=0, alpha=0.18)
        draw_raccoon(ctx, BX - 1100, FL + 90, 100, 1, raccoon_pose(t, "sit", look=0.3))
    fx.darkness(ctx, 0.3)
    place_tag(ctx, "TEST NIGHT", t, 70, 210, "#fff6d8", "#7a4fc2")


def shot_rise(ctx, t, S):
    """Вентилятор — оболочка вздувается; горелка — светится и встаёт, вместе с корзиной."""
    d = S.cue(2) - S.cue(1)
    T_BURN, T_UP = d * 0.3, d * 0.85
    fill = lerp(0.15, 0.85, smooth(clamp(t / T_BURN))) if t < T_BURN else lerp(0.85, 1.0, clamp((t - T_BURN) / 1.0))
    ang = math.pi / 2 * (1 - smooth(clamp((t - T_BURN) / (T_UP - T_BURN)))) if t > T_BURN else math.pi / 2
    fire = 1.0 if t > T_BURN and (t % 0.9) < 0.6 else 0.0
    glow = 0.0 if t < T_BURN else clamp((t - T_BURN) / 0.6) * (0.6 + 0.4 * fire)
    cam = Cam(Keys((0, 2200), (T_BURN, 2300), (d, BX, "io")), Keys((0, FL - 420), (T_BURN, FL - 500), (d, FL - 1000, "io")),
              Keys((0, 0.5), (T_BURN, 0.55), (d, 0.42, "io")), anchor=(1800, 520))
    field_back(ctx, t, cam)
    with layer(ctx, cam, t):
        fan(ctx, BX - 520, FL + 60, t, on=True)
        rig(ctx, t, ang, fill, 0.8 * fire, glow)       # лёжа горелка бьёт вбок, в горловину
        p = R.stand("side", t, 1)
        p.update(h1=(0.6, -3.0) if t > T_BURN else (0.3, -1.7), look=(1, -0.8 * clamp((t - T_BURN) / d)))
        RASCAL_PATCH.draw(ctx, BX - 820, FL + 80, 112, 1, rascal_pose(p, "happy" if t > T_UP * 0.8 else "calm"))
        draw_raccoon(ctx, BX - 1100, FL + 90, 100, 1, raccoon_pose(t, "sit", look=0.6))
    fx.darkness(ctx, 0.3 * (1 - glow * 0.6), [fx.Light(*cam.to_screen(t, BX, FL - 900), 1100, power=glow, glow_a=0.2)])
    if t < T_BURN:
        pop_text(ctx, "WHIRRR", W / 2 - 420, 300, t, 0.2, 80, "#c9d0d6", dur=T_BURN)
    elif t < T_UP:
        pop_text(ctx, "FWOOOSH", W / 2 + 380, 260, t, T_BURN, 90, "#ffd23a", dur=T_UP - T_BURN)
    else:
        pop_text(ctx, "IT STANDS!", W / 2, 200, t, T_UP, 100, "#ffd23a", dur=d, shake=False)


def shot_bright(ctx, t, S):
    """Издалека: светящийся шар над тёмным парком и рёв горелки; по всему парку оборачиваются головы с горящими глазами."""
    d = S.cue(3) - S.cue(2)
    T_HEADS = d * 0.45
    fire = 1.0 if (t % 0.9) < 0.6 else 0.0
    if t < T_HEADS:
        cam = Cam(BX + 300, FL - 900, Keys((0, 0.2), (T_HEADS, 0.22)), anchor=(1800, 520))
        field_back(ctx, t, cam)
        with layer(ctx, cam, t):
            rig(ctx, t, 0.0, 1.0, fire, 0.6 + 0.4 * fire)
            crowd_floor(ctx, t, 191, 120, -4000, 8000, FL + 200, FL + 700, 70, 90)
        fx.darkness(ctx, 0.45, [fx.Light(*cam.to_screen(t, BX, FL - 900), 900, power=0.7 + 0.3 * fire, glow_a=0.3)])
        for k in range(4):
            r = 120 + ((t * 300 + k * 140) % 560)
            D.circle(ctx, W / 2 + 60, 380, r, None, hexrgb("#ffd23a"), 6, alpha=0.6 * (1 - r / 680))
        pop_text(ctx, "BRIGHTEST. LOUDEST.", W / 2, 200, t, 0.5, 80, "#ffd23a", dur=T_HEADS, shake=False)
        return
    tt = t - T_HEADS
    D.rect(ctx, 0, 0, W, H, hexrgb("#0e1020"), None, 0, wob=0)
    heads_sea(ctx, tt, -100, W + 100, 420, 1180, 40, seed=19, s0=60, s1=170, up=0.6, arms=0.3, glow=1.0)
    D.radial(ctx, W / 2, -100, 900, "#ffb03c", 0.25 + 0.1 * fire, 0)
    pop_text(ctx, "THEY COME.", W / 2, 230, tt, 0.4, 100, "#9fc86a", dur=d, shake=True)


def shot_vent(ctx, t, S):
    """Толпа входит на поле; Раскал дёргает красную стропу клапана — шар ложится плашмя на тридцать зомби."""
    d = S.dur - S.cue(3)
    T_PULL, T_FALL = d * 0.25, d * 0.5
    fall = smooth(clamp((t - T_PULL - 0.2) / (T_FALL - T_PULL)))
    ang = -math.pi / 2 * fall ** 1.6
    fill = 1.0 - 0.25 * fall
    flat = clamp((t - T_FALL) / 0.4)
    cam = Cam(BX - 600, FL - 700, Keys((0, 0.36), (d, 0.4)), anchor=(1800, 520))
    field_back(ctx, t, cam)

    def zpose(m, tt):
        tt = t
        if tt < T_FALL:
            q = R.gait(m.ph0 + m.vx * tt / m.s / R.GAITS["shamble"]["L"], "shamble", "side", m.seed)
            q.update(a1=(1.5, -0.2), a2=(1.3, -0.1))
            return q
        q = zombie_idle(tt, m.seed % 97)
        q.update(lean=0.4, a1=(0.6, 0.6), a2=(0.4, 0.6))
        return q
    SHEET0, SHEET1 = BX - 2080, BX - 700          # где лежит ткань после падения
    with layer(ctx, cam, t):
        tp = min(t, T_FALL)          # после падения — стоят на месте
        crowd_floor(ctx, tp, 192, 30, -1600, 800, FL - 20, FL + 260, 100, 118, vx=(55, 90), pose_fn=zpose,
                    filt=(lambda m: True) if flat <= 0 else (lambda m: not (SHEET0 < m.x + m.vx * tp < SHEET1)))
        if flat <= 0:
            rig(ctx, t, ang, fill, 0.0, 0.5 * (1 - fall))
        else:
            w = 360 * BS
            px, py = BX - w / 2, FL + 30
            ctx.save()
            ctx.translate(px, py)
            ctx.rotate(-math.pi / 2)
            ctx.translate(-px, -py)
            BL.basket(ctx, BX, FL + 30, BS, "night", 0.0, t, tanks=2)
            ctx.restore()
            ctx.save()
            ctx.translate(BX - 720, FL - 120)
            ctx.scale(-1, 1)
            BL.laid_out(ctx, 0, 0, BS, "night", None, t, lift=0.0)
            ctx.restore()
            # горбы: под тканью шевелятся зомби
            for k in range(11):
                hx = BX - 880 - k * 105
                hy = FL - 200 - 26 * abs(math.sin(t * 3 + k * 1.7))
                D.ellipse(ctx, hx, hy, 58, 46, tone(BL.GORES[k % 4], "night"), D.INK, 3)
        # стропа клапана от макушки к руке Раскала
        p = R.stand("side", t, 1)
        pull = smooth(clamp((t - T_PULL) / 0.3))
        p.update(h1=(0.6 - 0.4 * pull, -3.2 + 1.0 * pull), h2=(0.5, -3.0 + 0.8 * pull), lean=-0.2 * pull)
        J = RASCAL_PATCH.draw(ctx, BX + 600, FL + 80, 112, -1, rascal_pose(p, "sweat"))
        hx, hy = RASCAL_PATCH.world(BX + 600, FL + 80, 112, -1, J["hand1"])
        if fall < 0.05:
            D.line(ctx, hx, hy, BX, FL - 1500, hexrgb("#e8423c"), 5)
        draw_raccoon(ctx, BX + 900, FL + 90, 100, -1, raccoon_pose(t, "sit", look=-0.5))
    fx.darkness(ctx, 0.35)
    if t > T_PULL:
        pop_text(ctx, "YANK!", W / 2 + 420, 300, t, T_PULL, 90, "#ff8a7a", dur=0.8)
    if t > T_FALL:
        pop_text(ctx, "FLUMP!", W / 2 - 300, 280, t, T_FALL, 140, "#fff6d8", dur=1.4)
        counter_badge(ctx, "UNDER IT", 30, W - 320, 160, "#9fc86a", 440)


def build(S):
    c = S.cue
    S.shots = [
        Shot(0, shot_field, "fade", 0.4),
        Shot(c(1) - 0.1, shot_rise, "fade", 0.3),
        Shot(c(2) - 0.1, shot_bright, "fade", 0.3),
        Shot(c(3) - 0.1, shot_vent, "fade", 0.25),
    ]
    S.tods = [(0, "night")]
    d1, d3 = c(2) - c(1), S.dur - c(3)
    S.sfx += [(c(1) + 0.2, "fan", 0.8), (c(1) + d1 * 0.3, "burner", 1.0), (c(1) + d1 * 0.6, "burner", 1.0),
              (c(2) + 0.3, "burner", 0.8), (c(2) + (c(3) - c(2)) * 0.45, "zombie_groan", 1.0),
              (c(3) + d3 * 0.25, "rope_creak", 0.8), (c(3) + d3 * 0.5, "thud", 1.0), (c(3) + d3 * 0.55, "crowd_groan", 0.8)]
    S.music = [(0, "mystery", 0.7), (c(1), "wonder", 1.0), (c(2) + (c(3) - c(2)) * 0.45, "tension", 1.0),
               (c(3) + d3 * 0.5, "comic", 0.8)]
