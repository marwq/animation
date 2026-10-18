"""Базовые вещи: размер кадра, цвета, интерполяция, ключи, шум."""
import math
import random

W, H, FPS = 1920, 1080, 30
TAU = math.pi * 2


def clamp(v, a=0.0, b=1.0):
    return a if v < a else b if v > b else v


def lerp(a, b, t):
    if isinstance(a, tuple):
        return tuple(x + (y - x) * t for x, y in zip(a, b))
    return a + (b - a) * t


def inv_lerp(a, b, v):
    return clamp((v - a) / (b - a)) if b != a else 1.0


def remap(v, a, b, c, d):
    return lerp(c, d, inv_lerp(a, b, v))


# --- сглаживание -----------------------------------------------------------

def linear(t):
    return t


def smooth(t):
    t = clamp(t)
    return t * t * (3 - 2 * t)


def ease_io(t):
    t = clamp(t)
    return 0.5 - 0.5 * math.cos(math.pi * t)


def ease_in(t):
    t = clamp(t)
    return t * t * t


def ease_out(t):
    t = clamp(t)
    return 1 - (1 - t) ** 3


def ease_io3(t):
    t = clamp(t)
    return 4 * t * t * t if t < 0.5 else 1 - (-2 * t + 2) ** 3 / 2


def ease_out_back(t, k=1.70158):
    t = clamp(t) - 1
    return 1 + (k + 1) * t * t * t + k * t * t


def ease_out_elastic(t):
    t = clamp(t)
    if t in (0, 1):
        return t
    return 2 ** (-10 * t) * math.sin((t * 10 - 0.75) * TAU / 3) + 1


def bounce_out(t):
    t = clamp(t)
    n, d = 7.5625, 2.75
    if t < 1 / d:
        return n * t * t
    if t < 2 / d:
        t -= 1.5 / d
        return n * t * t + 0.75
    if t < 2.5 / d:
        t -= 2.25 / d
        return n * t * t + 0.9375
    t -= 2.625 / d
    return n * t * t + 0.984375


EASES = {"lin": linear, "smooth": smooth, "io": ease_io, "in": ease_in, "out": ease_out,
         "io3": ease_io3, "back": ease_out_back, "elastic": ease_out_elastic, "bounce": bounce_out}


def win(t, a, b):
    """0..1 внутри отрезка [a, b]."""
    return inv_lerp(a, b, t)


def pulse(t, a, b, fade=0.2):
    """1 внутри [a, b] с мягкими краями."""
    return clamp(min((t - a) / fade + 1, (b - t) / fade + 1))


class Keys:
    """Ключи анимации: Keys((t, v), (t, v, 'ease'), ...) -> значение в момент t.

    Сглаживание указывается у ключа, к которому идёт переход.
    Значение — число или кортеж чисел.
    """

    def __init__(self, *keys):
        for k in keys:
            if not isinstance(k, tuple):
                raise TypeError("Keys: ключ должен быть кортежем (t, v[, ease]), получено %r" % (k,))
        self.k = [(k[0], k[1], k[2] if len(k) > 2 else "io") for k in keys]

    def __call__(self, t):
        k = self.k
        if t <= k[0][0]:
            return k[0][1]
        for i in range(1, len(k)):
            if t <= k[i][0]:
                t0, v0, _ = k[i - 1]
                t1, v1, e = k[i]
                u = (t - t0) / (t1 - t0) if t1 > t0 else 1.0
                return lerp(v0, v1, EASES[e](u))
        return k[-1][1]


# --- цвета -----------------------------------------------------------------

def hexrgb(h):
    h = h.lstrip("#")
    if len(h) == 3:
        h = "".join(ch * 2 for ch in h)
    return tuple(int(h[i:i + 2], 16) / 255 for i in (0, 2, 4))


def mix(a, b, t):
    return tuple(x + (y - x) * t for x, y in zip(a, b))


def shade(c, k):
    """k < 0 темнее, k > 0 светлее."""
    if k < 0:
        return tuple(x * (1 + k) for x in c)
    return tuple(x + (1 - x) * k for x in c)


# --- шум -------------------------------------------------------------------

def _hash(i, seed):
    n = (i * 374761393 + seed * 668265263) & 0xFFFFFFFF
    n = (n ^ (n >> 13)) * 1274126177 & 0xFFFFFFFF
    return ((n ^ (n >> 16)) & 0xFFFF) / 0xFFFF * 2 - 1


def noise1(x, seed=0):
    """Гладкий шум 1D в диапазоне [-1, 1]."""
    i = math.floor(x)
    f = x - i
    u = f * f * (3 - 2 * f)
    return _hash(i, seed) * (1 - u) + _hash(i + 1, seed) * u


def fbm(x, seed=0, octaves=3):
    s, a, tot = 0.0, 1.0, 0.0
    for o in range(octaves):
        s += noise1(x * (2 ** o), seed + o * 31) * a
        tot += a
        a *= 0.5
    return s / tot


def rng(seed):
    return random.Random(seed)
