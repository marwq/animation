"""Сборка фонов по слоям с параллаксом и кэшем: палуба, мостик, лайнер снаружи."""
from scenes.kit import *

DECK_RECT = (DK.X0 - 200, -700, DK.X1 - DK.X0 + 400, 2300)


def deck_s(y):
    """Масштаб персонажа на палубе по глубине (y — точка на полу)."""
    return 95 * (1 + (y - 1000) / 900)


def deck_back(ctx, t, cam, tod="day", power=1.0, sun=None, moon=None, screen=True, rough=0.0, mess=0.0,
              slides=True, broken=False, chairs=True, clouds=True, scale=1.0, key=""):
    """Небо и океан (параллакс 0.3), надстройки и палуба (кэш)."""
    with layer(ctx, cam, t, 0.3):
        DK.backdrop(ctx, t, tod, sun=sun, moon=moon, rough=rough, clouds=clouds)
    with layer(ctx, cam, t):
        k = "deckfar_%s_%s_%s_%s_%s_%s" % (tod, power, screen, slides, broken, key)
        bg(ctx, k, DECK_RECT, lambda c: DK.far(c, tod, power, screen, slides, broken), scale)
        k2 = "deckfloor_%s_%s_%s_%s" % (tod, chairs, mess, key)
        bg(ctx, k2, (DK.X0 - 200, 600, DK.X1 - DK.X0 + 400, 1200), lambda c: DK.floor(c, tod, chairs, mess), scale)


def bridge_back(ctx, t, cam, tod="day", power=1.0, sun=None, moon=None, rough=0.0, roll=0.0, battery=None,
                autopilot=True, door_glass=True, hatch_open=0.0, scale=1.0, wheel_ang=None):
    ctx.save()
    m = ctx.get_matrix()
    cam.apply(ctx, t)
    BR._win_path(ctx)
    ctx.clip()
    ctx.set_matrix(m)
    cam.apply(ctx, t, 0.6)
    BR.outside(ctx, t, tod, rough=rough, roll=roll, sun=sun, moon=moon, clip=False)
    ctx.restore()
    with layer(ctx, cam, t):
        k = "bridge_%s_%s_%s_%s" % (tod, power, door_glass, hatch_open)
        bg(ctx, k, (-300, -400, 3600, 1800), lambda c: BR.room(c, tod, power, door_glass, hatch_open), scale)
        BR.screens(ctx, t, power, autopilot, battery)
        if wheel_ang is not None:
            BR.wheel(ctx, BR.WHEEL_X, 640, 90, wheel_ang, "day" if power > 0 else tod)


def sea_back(ctx, t, cam, tod="day", sun=None, moon=None, rough=0.0, hy=560, p=0.3, clouds=True, seed=4):
    with layer(ctx, cam, t, p):
        DK.backdrop(ctx, t, tod, x0=-3000, x1=6000, hy=hy, sun=sun, moon=moon, rough=rough, clouds=clouds, seed=seed)


def ship_ext(ctx, t, cam, x, wl, s, tod="day", lit=0.0, f=1, wake=1.0, smoke=True, slides=True, antenna=True,
             scale=1.0):
    """Лайнер сбоку в мире камеры."""
    with layer(ctx, cam, t):
        if wake > 0:
            SH.wake(ctx, x, wl, s, t, f, wake)
        k = "ship_%s_%s_%s_%s_%s_%.3f" % (tod, lit, f, slides, antenna, s)
        w = 2700 * s
        ctx.save()
        ctx.translate(x, wl)
        bg(ctx, k, (-w / 2 - 50, -900 * s, w + 100, 960 * s),
           lambda c: SH.ship_side(c, 0, 0, s, tod, lit, f, slides=slides, antenna=antenna), scale)
        ctx.restore()
        SH.radar(ctx, x, wl, s, t, f, tod)
        if smoke:
            SH.smoke(ctx, x, wl, s, t, f, 0.5 if tod not in ("night", "deepnight") else 0.25)
        SEA.foam_line(ctx, x - 1180 * s, x + 1180 * s, wl + 2, t, 3, 0.7)


def dance_pose(t, seed=0):
    """Вечеринка: руки вверх, покачивание, пружинящие колени."""
    r = random.Random(seed)
    ph = t * 4.2 + r.random() * 6
    p = R.stand("front" if r.random() < 0.5 else "side", t, seed)
    bounce = abs(math.sin(ph)) * 0.08
    p["hip"] = (math.sin(ph * 0.5) * 0.08, bounce)
    style = seed % 3
    if style == 0:
        p.update(a1=(2.6 + 0.4 * math.sin(ph), 0.3), a2=(2.4 - 0.4 * math.sin(ph), 0.4))
    elif style == 1:
        p.update(a1=(1.2 + 0.6 * math.sin(ph), 1.2), a2=(0.3, 1.6 + 0.4 * math.sin(ph + 1)))
    else:
        p.update(a1=(2.9, 0.2 * math.sin(ph * 2)), a2=(0.4 + 0.5 * math.sin(ph), 0.8))
    p.update(face="laugh" if (seed % 2) else "happy", lean=math.sin(ph * 0.5) * 0.05)
    return p


def panic_pose(t, seed=0):
    """Бегущий в панике пассажир (поверх бега): руки вверх."""
    return {"a1": (2.8 + 0.3 * math.sin(t * 9 + seed), 0.3), "a2": (2.6, 0.5), "face": "scream", "blink": 0}


class Runner:
    """Персонаж, бегущий по палубе с постоянной скоростью (для толпы)."""

    def __init__(self, fig, x0, y, v, t0=0.0, kind="run", seed=0, panic=False):
        self.fig, self.x0, self.y, self.v, self.t0, self.kind = fig, x0, y, v, t0, kind
        self.seed, self.panic = seed, panic

    def draw(self, ctx, t, s=None):
        tt = max(0.0, t - self.t0)
        x = self.x0 + self.v * tt
        s = s or deck_s(self.y)
        g = R.GAITS[self.kind]
        p = R.gait(abs(self.v) * tt / s / g["L"] + self.seed * 0.37, self.kind, "side", self.seed)
        if self.panic:
            p.update(panic_pose(t, self.seed))
        if self.fig.look.zombie:
            p.update(mouth=0.6 + 0.3 * math.sin(t * 6 + self.seed))
        self.fig.draw(ctx, x, self.y, s, 1 if self.v >= 0 else -1, p)
        return x
