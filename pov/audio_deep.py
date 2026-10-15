"""Звук после трёх минут (3:00–15:30): музыка дальше и звук слоёв — скала, жар, жидкое железо, кристаллы,
центр Земли, подъём, океан, поверхность. Всё синтезируется, без чужих записей и без голоса.

Ролик длинный, поэтому звук собирается окнами: каждый кусок считается с запасом по краям (хвосты
реверберации и фильтров) и потом стыкуется с соседним мягким перекрёстом. Источники зависят только от
абсолютного времени (фаза осцилляторов, ноты, события), поэтому соседние окна совпадают на стыке.

Запуск из корня:
    python3 pov/audio_deep.py 180 240     -> pov/out/deep_audio/seg_180_240.wav (с запасом ±0.25 с)
"""
import json
import sys
import wave
from pathlib import Path

import numpy as np
from scipy.signal import butter, fftconvolve, sosfilt, sosfilt_zi

HERE = Path(__file__).resolve().parent
SCENE = json.loads((HERE / 'scene.json').read_text())
SR = 48000
DUR = float(SCENE['duration'])
EARTH = SCENE['earth']
HALF = EARTH / 2
CEN0, CEN1 = SCENE['center']
MARGIN = 6.0  # с: запас перед окном (реверберация, фильтры), после окна — 1 с
XF = 0.25  # с: на стыке окна перекрываются на 2·XF

# --- фильтры и шум ---------------------------------------------------------------


def _sos(kind, f, order=2):
    return butter(order, f, btype=kind, fs=SR, output='sos')


def lp(x, f, order=2):
    return sosfilt(_sos('low', min(f, SR * 0.45), order), x)


def hp(x, f, order=2):
    return sosfilt(_sos('high', f, order), x)


def bp(x, lo, hi, order=2):
    return sosfilt(_sos('band', [lo, min(hi, SR * 0.45)], order), x)


def vlp(x, cutoff, order=2, block=256):
    y = np.empty_like(x)
    zi = None
    for i in range(0, len(x), block):
        sos = _sos('low', float(np.clip(cutoff[min(i, len(cutoff) - 1)], 30, SR * 0.45)), order)
        if zi is None:
            zi = sosfilt_zi(sos) * x[0]
        y[i:i + block], zi = sosfilt(sos, x[i:i + block], zi=zi)
    return y


def rng_for(name, a):
    return np.random.default_rng(abs(hash((name, round(a, 3)))) % (2 ** 32))


def pink(r, n):
    w = np.fft.rfft(r.standard_normal(n))
    f = np.fft.rfftfreq(n, 1 / SR)
    w[1:] /= np.sqrt(f[1:])
    w[0] = 0
    x = np.fft.irfft(w, n)
    return x / np.std(x)


def brown(r, n):
    x = np.cumsum(r.standard_normal(n))
    x = hp(x, 15)
    return x / (np.std(x) + 1e-9)


def make_ir(rt60, length, bright, dark, seed, early=()):
    r = np.random.default_rng(seed)
    n = int(length * SR)
    tt = np.arange(n) / SR
    decay = 10 ** (-3 * tt / rt60)
    out = []
    for ch in range(2):
        x = r.standard_normal(n) * decay
        mix = np.exp(-tt / (rt60 * 0.25))
        y = lp(x, bright) * mix + lp(x, dark) * (1 - mix)
        for d, g in early:
            i = int(d * SR)
            if i < n:
                y[i] += g
        out.append(y)
    ir = np.stack(out)
    return ir / np.sqrt(np.sum(ir ** 2) / 2)


IR_HALL = make_ir(4.2, 5.0, 7000, 2200, 11, early=[(0.023, 0.3), (0.041, 0.22)])
IR_STONE = make_ir(0.9, 1.4, 3000, 700, 12, early=[(0.007, 0.4), (0.013, 0.3)])
IR_DEEP = make_ir(3.0, 4.0, 2500, 500, 13)
IR_WATER = make_ir(2.2, 3.0, 1800, 400, 14)


def reverb(x, ir, wet):
    if x.ndim == 1:
        x = np.vstack([x, x])
    n = x.shape[1]
    return np.stack([fftconvolve(x[c], ir[c])[:n] for c in range(2)]) * wet


# --- путь и голова: тот же сплайн, что в timeline.js ----------------------------------


def monotone(points):
    xs = np.array([p[0] for p in points], float)
    ys = np.array([p[1] for p in points], float)
    d = np.diff(ys) / np.diff(xs)
    m = np.zeros(len(xs))
    m[0], m[-1] = d[0], d[-1]
    for i in range(1, len(xs) - 1):
        m[i] = 0 if d[i - 1] * d[i] <= 0 else (d[i - 1] + d[i]) / 2
    for i in range(len(d)):
        if d[i] == 0:
            m[i] = m[i + 1] = 0
            continue
        a, b = m[i] / d[i], m[i + 1] / d[i]
        s = a * a + b * b
        if s > 9:
            k = 3 / np.sqrt(s)
            m[i], m[i + 1] = k * a * d[i], k * b * d[i]

    def f(x):
        x = np.atleast_1d(np.asarray(x, float))
        i = np.clip(np.searchsorted(xs, x) - 1, 0, len(xs) - 2)
        h = xs[i + 1] - xs[i]
        u = np.clip((x - xs[i]) / h, 0, 1)
        return ((2 * u ** 3 - 3 * u ** 2 + 1) * ys[i] + (u ** 3 - 2 * u ** 2 + u) * h * m[i]
                + (-2 * u ** 3 + 3 * u ** 2) * ys[i + 1] + (u ** 3 - u ** 2) * h * m[i + 1])
    return f


S_AT = monotone(SCENE['depth'])


def spring(keys, omega, rate=240):
    f = monotone(keys)
    t0 = keys[0][0] - 1
    grid = np.arange(t0, keys[-1][0] + 1, 1 / rate)
    target = f(grid)
    out = np.empty_like(grid)
    x, v, dt = target[0], 0.0, 1 / rate
    for i, tg in enumerate(target):
        v += (omega * omega * (tg - x) - 2 * omega * v) * dt
        x += v * dt
        out[i] = x
    return grid, out


_YG, _YV = spring(SCENE['head_yaw'], 5.5)
_BG, _BV = spring(SCENE['body_yaw'], 4)


def heading(tt):
    return np.radians(np.interp(tt, _YG, _YV) + np.interp(tt, _BG, _BV))


def temperature(s):
    T = SCENE['temperature']
    return np.interp(s, [k[0] for k in T], [k[1] for k in T])


def env(points, tt):
    xs, ys = zip(*points)
    return np.interp(tt, xs, ys)


def pan(sig, az, heading_):
    """Источник под азимутом az (рад, влево +) при повороте головы heading → стерео, сзади глуше."""
    rel = az - heading_
    p = np.clip(-np.sin(rel), -1, 1) * 0.8
    back = np.clip(-np.cos(rel), 0, 1)
    sig = sig * (1 - 0.35 * back)
    return np.vstack([sig * np.cos((p + 1) * np.pi / 4), sig * np.sin((p + 1) * np.pi / 4)])


def midi(n):
    return 440.0 * 2 ** ((n - 69) / 12)


SAW = np.zeros(4096)
for k in range(1, 24):
    SAW += np.sin(2 * np.pi * k * np.arange(4096) / 4096) / k * (1 if k < 12 else 0.5)
SAW /= np.max(np.abs(SAW))


def osc(freq, tt, table=SAW, phase0=0.0):
    ph = (phase0 + freq * tt) % 1.0  # фаза от абсолютного времени: соседние окна совпадают
    idx = ph * len(table)
    i0 = idx.astype(int)
    k = idx - i0
    return table[i0 % len(table)] * (1 - k) + table[(i0 + 1) % len(table)] * k


# --- когда что происходит --------------------------------------------------------------


def crossing(s_value):
    lo, hi = 180.0, DUR
    for _ in range(60):
        mid = (lo + hi) / 2
        if S_AT(mid)[0] < s_value:
            lo = mid
        else:
            hi = mid
    return hi


BOUNDARIES = {name: crossing(s) for name, s in [
    ('moho', 36000), ('lab', 100000), ('d410', 410000), ('d660', 660000), ('cmb', 2890000), ('icb', 5150000),
    ('icb2', EARTH - 5150000), ('cmb2', EARTH - 2890000), ('d660b', EARTH - 660000), ('d410b', EARTH - 410000),
    ('moho2', EARTH - 11320), ('floor', EARTH - 4321)]}
SURFACE_T = SCENE['ocean']['surface']
CHECKS = [k[0] for i, k in enumerate(SCENE['check']) if k[1] == 1 and SCENE['check'][i - 1][1] == 0 and k[0] > 180]

# аккорды: (начало, конец, ноты MIDI)
def cycle(t0, t1, chords, period):
    out = []
    t = t0
    i = 0
    while t < t1 - 0.5:
        out.append((t, min(t1, t + period + 0.6), chords[i % len(chords)]))
        t += period
        i += 1
    return out


CHORDS = [(174.0, 186.5, [26, 38, 50, 57, 64, 69, 76])]
CHORDS += cycle(186, 232, [[38, 50, 57, 60, 64], [34, 46, 53, 57, 62, 65], [31, 43, 50, 53, 58, 62], [33, 45, 52, 55, 57, 62]], 8)
CHORDS += cycle(232, 290, [[41, 48, 55, 57, 60, 64], [40, 48, 55, 60, 62, 67], [38, 50, 55, 57, 60, 65], [34, 46, 53, 57, 60, 62]], 8)
CHORDS += cycle(290, 340, [[31, 43, 50, 53, 57, 62], [39, 46, 53, 55, 58, 62], [36, 48, 55, 58, 62, 63]], 8.4)
CHORDS += [(340, 350.6, [38, 50, 55, 57, 60, 67])]
CHORDS += cycle(350, 459, [[38, 50, 57, 61, 64, 66], [35, 47, 54, 57, 61, 64], [43, 50, 57, 59, 62, 66], [45, 52, 57, 59, 61, 64]], 8)
CHORDS += cycle(459, 480, [[42, 49, 54, 57, 61, 64], [40, 47, 54, 56, 59, 63]], 7)
CHORDS += cycle(480, 545, [[36, 43, 48, 51, 55, 62], [32, 44, 51, 55, 60], [29, 41, 48, 51, 55, 60], [31, 43, 48, 50, 53, 62]], 8.2)
CHORDS += cycle(545, 640, [[27, 39, 46, 50, 53, 58, 62], [24, 36, 43, 46, 51, 53, 58], [32, 44, 51, 55, 58, 63], [34, 46, 53, 58, 60, 65]], 10)
CHORDS += cycle(640, 694, [[31, 43, 50, 54, 57, 61, 66], [28, 40, 47, 50, 54, 57, 62], [36, 43, 48, 52, 54, 59, 64], [38, 45, 50, 54, 57, 59, 64]], 9)
CHORDS += [(694, 709, [55, 59, 62, 66, 69, 74])]
CHORDS += cycle(708, 760, [[43, 50, 55, 59, 62], [42, 50, 54, 57, 62], [40, 47, 52, 55, 59, 64], [36, 48, 52, 55, 60, 64]], 6.5)
CHORDS += cycle(760, 815, [[45, 52, 57, 61, 64], [44, 52, 56, 59, 64], [42, 49, 54, 57, 61], [38, 50, 54, 57, 62]], 6.5)
CHORDS += cycle(815, 835.5, [[35, 47, 54, 57, 61, 64], [43, 50, 54, 57, 62], [40, 47, 54, 57, 59, 62], [42, 49, 54, 56, 61]], 5.2)
CHORDS += [(835, 862, [26, 38, 45, 52, 57, 64]), (861, 880, [29, 41, 48, 52, 57, 64])]
CHORDS += cycle(880, 900.5, [[41, 48, 55, 57, 60, 64], [45, 52, 57, 59, 60, 64], [48, 55, 60, 62, 64, 67], [47, 55, 59, 62, 67, 69]], 5.1)
CHORDS += [(900.2, 908, [48, 55, 59, 62, 64]), (907, 915, [40, 57, 59, 60, 64]), (914, 922, [41, 48, 52, 57, 59]), (921, 931, [36, 48, 55, 62, 64, 67])]

# колокольчик: по 2–3 ноты из верхних тонов каждого аккорда + повтор мотива начала ролика на рассвете
_mr = np.random.default_rng(31)
BELLS = []
for a, b, notes in CHORDS:
    if a < 186 or 694 <= a < 709 or 835 <= a < 880:
        continue
    tops = sorted({n + 12 * k for n in notes for k in range(0, 4) if 67 <= n + 12 * k <= 88})
    for j in range(2 if b - a < 7 else 3):
        BELLS.append((a + 1.0 + j * (b - a - 1.5) / 3 + _mr.uniform(-0.3, 0.3), int(_mr.choice(tops))))
for k in range(16):  # алмазы: переливы
    BELLS.append((BOUNDARIES['lab'] + 18 + k * 0.42, [81, 86, 88, 93, 91, 86][k % 6]))
for k in range(10):  # центр Земли: высокие редкие ноты
    BELLS.append((694.5 + k * 1.4, [79, 83, 86, 90, 88][k % 5]))
OPENING = [(1.4, 76), (2.3, 79), (3.1, 81), (4.6, 79), (5.9, 76), (6.8, 74), (7.6, 76), (8.9, 79), (9.7, 84), (10.6, 83), (11.6, 81)]
BELLS += [(901.0 + t * 1.6, n) for t, n in OPENING]  # мотив с Таймс-сквер — на другой стороне Земли
BELLS.sort()

# пульс-сердцебиение: в скале чаще с глубиной, в центре замирает, на подъёме — снова, в океане — нет
BEATS = []
_b = 180.3
while _b < 835:
    if CEN0 - 4 < _b < CEN1 + 3:
        _b += 0.5
        continue
    s_here = float(S_AT(_b)[0])
    k = np.clip(np.log10(max(s_here, 1000) / 1000) / 3.8, 0, 1) if s_here < HALF else 0.85
    BEATS.append(_b)
    _b += 0.98 - 0.42 * k

# --- источники ----------------------------------------------------------------


def music(tt):
    a, b = tt[0], tt[-1]
    out = np.zeros((2, len(tt)))
    for c0, c1, notes in CHORDS:
        if c1 + 1.6 < a or c0 > b:
            continue
        e = np.clip((tt - c0) / 1.4, 0, 1) * np.clip((c1 + 1.6 - tt) / 1.6, 0, 1)
        if not e.any():
            continue
        for note in notes:
            f = midi(note)
            for det, p in [(-0.006, -0.6), (0.0, 0.0), (0.006, 0.6)]:
                v = osc(f * (1 + det), tt, phase0=(note * 0.137 + det * 50) % 1) * e * (0.11 if note < 45 else 0.07 if note < 70 else 0.045)
                out[0] += v * np.cos((p + 1) * np.pi / 4)
                out[1] += v * np.sin((p + 1) * np.pi / 4)
    # фильтр: в скале глуше, на глубине раскрывается, в центре светло, в океане темно, на рассвете — ярко
    cut = env([(170, 3600), (186, 1500), (290, 1300), (345, 1100), (351, 1800), (460, 1500), (481, 1000), (545, 1400),
               (640, 2000), (694, 3200), (709, 2200), (760, 2000), (815, 1500), (836, 700), (870, 800), (885, 1600),
               (900, 3600), (931, 3800)], tt)
    out = np.stack([vlp(out[c], cut) for c in range(2)]) * (1 + 0.06 * np.sin(2 * np.pi * 0.11 * tt))
    bell = np.zeros(len(tt))
    partials = [(1.0, 1.0, 1.7), (2.0, 0.36, 0.9), (3.01, 0.17, 0.5), (4.2, 0.08, 0.3), (5.43, 0.05, 0.2)]
    for start, note in BELLS:
        if start > b or start + 3.2 < a:
            continue
        local = tt - start
        m = (local >= 0) & (local < 3.2)
        if not m.any():
            continue
        lt = local[m]
        f = midi(note)
        y = sum(am * np.sin(2 * np.pi * f * r * lt) * np.exp(-lt / dc) for r, am, dc in partials) * np.minimum(1, lt / 0.004)
        quiet = 1.0 if start > 900 else 0.75
        bell[m] += y * 0.09 * quiet
    pulse = np.zeros(len(tt))
    for beat in BEATS:
        if beat > b or beat + 0.6 < a:
            continue
        for dt, f0, g, dc in ((0, 48, 0.45, 0.13), (0.2, 44, 0.25, 0.11)):
            local = tt - beat - dt
            m = (local >= 0) & (local < 0.6)
            lt = local[m]
            pulse[m] += (np.sin(2 * np.pi * f0 * lt) + 0.25 * np.sin(4 * np.pi * f0 * lt)) * np.minimum(1, lt / 0.004) * np.exp(-lt / dc) * g * 0.7
    dry = out + np.vstack([bell * 0.9, bell]) + np.vstack([pulse, pulse])
    return dry + reverb(out[0] * 0.5 + out[1] * 0.5 + bell * 1.6, IR_HALL, 0.55)


def layer_weights(s):
    """Доли «звучаний» по пути: скала, жар, жидкость, кристалл, холодная кора той стороны, океан."""
    T = temperature(s)
    heat = np.clip((T - 450) / 900, 0, 1)
    liquid = ((s > 2890000) & (s < 5150000)) | ((s > EARTH - 5150000) & (s < EARTH - 2890000))
    crystal = (s >= 5150000) & (s <= EARTH - 5150000)
    ocean = s >= EARTH - 4321
    return T, heat, liquid.astype(float), crystal.astype(float), ocean.astype(float)


def beds(tt, r):
    n = len(tt)
    s = S_AT(tt)
    T, heat, liquid, crystal, ocean = layer_weights(s)
    # сглаживаем переключения слоёв (~1.5 с)
    k = int(1.5 * SR)
    win = np.hanning(k) / np.hanning(k).sum()

    def soften(x):  # свёртка через FFT (прямая на минутном окне считалась бы часами), края — продолжением
        y = fftconvolve(np.pad(x, k, mode='edge'), win, mode='same')
        return y[k:-k]
    liquid = soften(liquid)
    crystal = soften(crystal)
    ocean = soften(ocean)
    solid = np.clip(1 - liquid - crystal - ocean, 0, 1)
    out = np.zeros((2, n))
    deepness = np.clip(np.log10(np.maximum(np.minimum(s, EARTH - s), 1000) / 1000) / 3.8, 0, 1)
    rock = lp(brown(r, n), 60 + 40 * (1 - deepness.mean())) * (0.6 + 0.6 * deepness)
    out += np.vstack([rock, rock]) * solid * 0.14
    # жар: ровный рёв пламени и потрескивание
    roar = bp(pink(r, n), 120, 1800) * (1 + 0.3 * lp(r.standard_normal(n), 2) * 3)
    crackle = np.zeros(n)
    for i in np.nonzero(r.random(n) < 0.0009 * heat)[0]:
        m = min(n - i, 300)
        crackle[i:i + m] += r.standard_normal(m) * np.exp(-np.arange(m) / 40) * r.uniform(0.2, 1)
    crackle = hp(crackle, 1500)
    hz = heat * solid
    out += np.vstack([roar * (0.5 + 0.1 * np.sin(tt * 0.7)), roar * (0.5 - 0.1 * np.sin(tt * 0.7))]) * hz * 0.07
    out += np.vstack([crackle, np.roll(crackle, 137)]) * hz * 0.05
    # жидкое железо: тяжёлый плеск, бульканье, низкий «магнитный» гул с биениями
    slosh = lp(pink(r, n), 500) * (1 + 0.6 * np.sin(2 * np.pi * 0.17 * tt + np.sin(2 * np.pi * 0.05 * tt) * 2))
    gurgle = bp(r.standard_normal(n), 180, 700) * np.clip(lp(r.standard_normal(n), 6) * 5, 0, None)
    hum = np.sin(2 * np.pi * 41 * tt) + 0.7 * np.sin(2 * np.pi * 41.6 * tt) + 0.3 * np.sin(2 * np.pi * 82.3 * tt)
    out += np.vstack([slosh * 0.16 + gurgle * 0.1 + hum * 0.05, slosh * 0.16 + np.roll(gurgle, 911) * 0.1 + hum * 0.05]) * liquid
    # кристаллы железа: металлические резонансы, медленно переливаются
    ring = np.zeros(n)
    for f0, ph in ((220.0, 0.0), (277.2, 1.3), (349.2, 2.1), (415.3, 0.6), (523.3, 1.9)):
        ring += np.sin(2 * np.pi * f0 * tt + ph) * (0.5 + 0.5 * np.sin(2 * np.pi * (0.07 + f0 / 9000) * tt + ph))
    out += np.vstack([ring, np.roll(ring, 211)]) * crystal * 0.028
    out += np.vstack([rock, rock]) * crystal * 0.05
    # центр: почти тишина
    still = env([(0, 1), (CEN0 - 6, 1), (CEN0, 0.25), (CEN1, 0.25), (CEN1 + 5, 1), (DUR + 1, 1)], tt)
    out *= still
    # океан: глубинный гул, далёкое течение; ближе к поверхности — светлее
    depth_w = np.clip(EARTH - s, 0, 4321)
    sea = lp(brown(r, n), 120) * 0.9 + bp(pink(r, n), 150, 900) * (0.4 + 0.3 * np.sin(2 * np.pi * 0.09 * tt))
    sea_cut = 300 + 2500 * (1 - depth_w / 4321)
    sea = vlp(sea, sea_cut)
    under = ocean * (tt < SURFACE_T)
    out += np.vstack([sea, np.roll(sea, 523)]) * under * 0.2
    return out


def motion(tt, r):
    """Свист и гул скорости: по логарифму скорости, с насыщением; на подъёме — тот же поток."""
    n = len(tt)
    s1 = S_AT(tt + 0.05)
    s0 = S_AT(tt - 0.05)
    v = np.abs(s1 - s0) / 0.1
    k = np.clip(np.log10(np.maximum(v, 1)) / 4.5, 0, 1)
    k *= env([(0, 1), (CEN0 - 8, 1), (CEN0 - 1, 0), (CEN1 + 2, 0), (CEN1 + 10, 1), (DUR + 1, 1)], tt)
    whoosh = vlp(pink(r, n), 150 + 2600 * k) * k
    rumble = lp(brown(r, n), 70) * k
    sway = 0.18 * np.sin(2 * np.pi * 0.13 * tt)
    ocean = (tt >= BOUNDARIES['floor']) & (tt < SURFACE_T)
    w = np.where(ocean, 0.45, 1.0)
    return np.vstack([whoosh * (0.5 - sway), whoosh * (0.5 + sway)]) * 0.3 * w + np.vstack([rumble, rumble]) * 0.12 * w


def smooth_np(x):
    x = np.clip(x, 0, 1)
    return x * x * (3 - 2 * x)


def thud(r, length=1.2, f0=50):
    n = int(length * SR)
    t = np.arange(n) / SR
    return np.sin(2 * np.pi * (f0 * t - 6 * t ** 2)) * np.exp(-t / 0.4) + lp(r.standard_normal(n), 250) * np.exp(-t / 0.2) * 0.7


def place(out, tt, sig, start, gain=1.0, az=None):
    i0 = int(round((start - tt[0]) * SR))
    n = len(sig)
    a, b = max(0, i0), min(len(tt), i0 + n)
    if b <= a:
        return
    piece = sig[a - i0:b - i0] * gain
    if az is None:
        out[:, a:b] += piece
    else:
        out[:, a:b] += pan(piece, az, heading(tt[a:b]))


def events(tt, r):
    a, b = tt[0], tt[-1]
    out = np.zeros((2, len(tt)))
    # переходы между слоями: нарастающий шорох и глухой удар
    for name, tb in BOUNDARIES.items():
        if tb + 4 < a or tb - 4 > b:
            continue
        er = rng_for(name, 0)
        n = int(4.0 * SR)
        tl = np.arange(n) / SR
        swell = bp(er.standard_normal(n), 200, 4000) * np.clip(tl / 3.0, 0, 1) ** 2 * (tl < 3.0)
        place(out, tt, swell * 0.18, tb - 3.0)
        place(out, tt, thud(er, 2.0, 42 if name in ('cmb', 'icb', 'cmb2', 'icb2') else 55), tb, 0.55 if name != 'floor' else 0.3)
    # щелчки породы: в коре часто, в мантии — глухие стоны, в ядре нет
    t = a
    pr = rng_for('pops', a)
    while t < b:
        s = float(S_AT(t)[0])
        T = float(temperature(s))
        if s < 2890000 or s > EARTH - 2890000:
            if s < EARTH - 4321:
                n = int(0.3 * SR)
                tl = np.arange(n) / SR
                bright = 1 - np.clip((T - 300) / 1500, 0, 1)
                click = hp(pr.standard_normal(n), 900) * np.exp(-tl / 0.004) * bright
                body = np.sin(2 * np.pi * pr.uniform(55, 120) * tl) * np.exp(-tl / 0.07)
                place(out, tt, (click * 0.5 + body * 0.4) * pr.uniform(0.15, 0.5), t, az=pr.uniform(-3.1, 3.1))
        t += pr.exponential(1.6)
    # далёкие гулы
    for tr in (199, 247, 281, 318, 372, 433, 509, 527, 772, 806):
        if tr + 3 < a or tr > b:
            continue
        er = rng_for('rumble', tr)
        n = int(3.0 * SR)
        tl = np.arange(n) / SR
        g = lp(er.standard_normal(n), 110) * np.sin(np.pi * tl / tl[-1]) ** 2 * 1.4
        place(out, tt, g * 0.35, tr, az=er.uniform(-3, 3))
    # алмазы: стеклянный звон рядом
    t0 = BOUNDARIES['lab'] + 16
    for k in range(40):
        ts = t0 + k * 0.37 + rng_for('dia', k).uniform(0, 0.3)
        if ts < a - 1 or ts > b:
            continue
        n = int(0.6 * SR)
        tl = np.arange(n) / SR
        f = rng_for('dia', k).uniform(3000, 6200)
        ping = (np.sin(2 * np.pi * f * tl) + 0.4 * np.sin(2 * np.pi * f * 2.76 * tl)) * np.exp(-tl / 0.12)
        place(out, tt, ping * 0.03, ts, az=rng_for('dia', k).uniform(-2, 2))
    # то, что встречается в стенке (sights.js): жеода звенит стеклом, трещина журчит, разлом гудит и сыплется
    if a < 211 and b > 205:
        gr = rng_for('geode', 0)
        for k in range(26):
            ts = 207.0 + k * 0.11 + gr.uniform(0, 0.08)
            n = int(0.9 * SR)
            tl = np.arange(n) / SR
            f = gr.uniform(2400, 5200)
            ping = (np.sin(2 * np.pi * f * tl) + 0.3 * np.sin(2 * np.pi * f * 2.41 * tl)) * np.exp(-tl / 0.22)
            place(out, tt, ping * 0.022 * np.exp(-((ts - 208.4) / 1.2) ** 2), ts, az=np.radians(50))
    if a < 369 and b > 363:
        gr = rng_for('peridot', 0)
        for k in range(20):
            ts = 365.0 + k * 0.13 + gr.uniform(0, 0.08)
            n = int(0.9 * SR)
            tl = np.arange(n) / SR
            f = gr.uniform(1600, 3400)
            ping = (np.sin(2 * np.pi * f * tl) + 0.35 * np.sin(2 * np.pi * f * 2.0 * tl)) * np.exp(-tl / 0.26)
            place(out, tt, ping * 0.02 * np.exp(-((ts - 366.2) / 1.2) ** 2), ts, az=np.radians(50))
    if a < 255 and b > 248.5:
        cr = rng_for('crack', 0)
        t0, t1 = 249.3, 254.4
        n = int((t1 - t0) * SR)
        tl = np.arange(n) / SR
        swell = np.sin(np.pi * tl / tl[-1]) ** 2
        trickle = bp(cr.standard_normal(n), 900, 5000) * (0.5 + 0.5 * np.abs(lp(cr.standard_normal(n), 14)) * 3)
        place(out, tt, trickle * swell * 0.05, t0, az=np.radians(-52))
        td = t0 + 0.3
        while td < t1 - 0.3:
            m = int(0.12 * SR)
            tm = np.arange(m) / SR
            f = cr.uniform(900, 1600) * (1 + 0.6 * tm / tm[-1])
            plink = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tm / 0.03)
            place(out, tt, plink * 0.09 * np.sin(np.pi * (td - t0) / (t1 - t0)), td, az=np.radians(-52))
            td += cr.uniform(0.25, 0.6)
    if a < 262 and b > 257:
        fr = rng_for('fault', 0)
        place(out, tt, thud(fr, 2.4, 36), 258.3, 0.7)
        n = int(2.6 * SR)
        tl = np.arange(n) / SR
        grit = np.zeros(n)
        for i in np.nonzero(fr.random(n) < 0.004 * np.exp(-tl / 0.8))[0]:
            m = min(n - i, 400)
            grit[i:i + m] += fr.standard_normal(m) * np.exp(-np.arange(m) / 60) * fr.uniform(0.2, 1)
        grit = bp(grit, 300, 4000)
        place(out, tt, grit * 0.12, 258.3, az=np.radians(40))
        rum = lp(fr.standard_normal(n), 90) * np.exp(-tl / 0.9) * smooth_np(tl / 0.15)
        place(out, tt, rum * 1.3, 258.25)
    # браслет: сигнал, когда подносим к глазам
    for c in CHECKS:
        if c + 0.4 < a or c > b:
            continue
        n1 = int(0.08 * SR)
        tl = np.arange(n1) / SR
        beep = np.concatenate([np.sin(2 * np.pi * 1760 * tl) * np.exp(-tl / 0.05), np.zeros(int(0.025 * SR)), np.sin(2 * np.pi * 2637 * np.arange(int(0.1 * SR)) / SR) * np.exp(-np.arange(int(0.1 * SR)) / SR / 0.06)])
        place(out, tt, beep * 0.2, c + 0.2)
    # центр Земли: удар сердца и тишина; «Halfway» — мягкий подъём
    for tb in (CEN0, CEN1):
        place(out, tt, thud(rng_for('cen', tb), 2.5, 36), tb, 0.35)
    # кашалот: щелчки эхолокации слева, потом «скрип»
    if a < 879 and b > 866:
        cr = rng_for('whale', 0)
        tcl = 866.5
        while tcl < 878.5:
            n = int(0.02 * SR)
            click = hp(cr.standard_normal(n), 2000) * np.exp(-np.arange(n) / SR / 0.002)
            dist = 0.25 + 0.75 * np.exp(-((tcl - 872) / 3) ** 2)
            place(out, tt, click * 0.35 * dist, tcl, az=1.05)
            tcl += 0.55 if tcl < 874 else 0.08  # «скрип» — частые щелчки на охоте
    # всплытие: пузыри мимо лица, потом выход на поверхность — всплеск и воздух
    if a < SURFACE_T + 2 and b > SURFACE_T - 12:
        br = rng_for('bubbles', 0)
        for k in range(70):
            ts = SURFACE_T - 10 + br.uniform(0, 10)
            n = int(0.05 * SR)
            tl = np.arange(n) / SR
            f = br.uniform(300, 1100) * (1 + 1.5 * tl / tl[-1])
            place(out, tt, np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tl / 0.02) * br.uniform(0.05, 0.2), ts)
        n = int(1.5 * SR)
        tl = np.arange(n) / SR
        splash = bp(br.standard_normal(n), 300, 7000) * np.exp(-tl / 0.35) + lp(br.standard_normal(n), 300) * np.exp(-tl / 0.2)
        place(out, tt, splash * 0.5, SURFACE_T)
    return out


def surface(tt, r):
    """На поверхности: волны вокруг, ветер, плеск у тела."""
    n = len(tt)
    on = np.clip((tt - SURFACE_T) / 0.4, 0, 1)
    if not on.any():
        return np.zeros((2, n))
    swell = 0.5 + 0.5 * np.sin(2 * np.pi * tt / 6.5)
    waves = bp(pink(r, n), 200, 3000) * (0.4 + 0.8 * swell ** 3)
    wind = lp(pink(r, n), 900) * (0.6 + 0.3 * np.sin(2 * np.pi * 0.05 * tt))
    lap = bp(r.standard_normal(n), 500, 4000) * np.clip(np.sin(2 * np.pi * tt / 2.0) * 3 - 2, 0, None)
    out = np.vstack([waves * 0.14 + wind * 0.05 + lap * 0.06, np.roll(waves, 777) * 0.14 + wind * 0.05 + np.roll(lap, 333) * 0.06])
    return out * on


def compress(x, threshold_db=-16, ratio=2.4, attack=0.01, release=0.18):
    level = np.sqrt(lp(np.mean(x ** 2, axis=0), 30) + 1e-12)
    db = 20 * np.log10(level)
    over = np.maximum(0, db - threshold_db)
    gr = over - over / ratio
    g = np.empty_like(gr)
    ac, rc = np.exp(-1 / (attack * SR)), np.exp(-1 / (release * SR))
    state = 0.0
    for i in range(0, len(gr), 32):
        tg = gr[i]
        state = tg + (state - tg) * (ac ** 32 if tg > state else rc ** 32)
        g[i:i + 32] = state
    return x * 10 ** (-g / 20)


GAINS = {'music': 0.7, 'beds': 1.0, 'motion': 1.0, 'events': 1.0, 'surface': 1.0}
# Мастер: постоянные усиления (не по пику окна), чтобы громкость не прыгала между окнами.
# master_gain.json пишет calibrate: громкость начала глубин совпадает с концом первых трёх минут.
_MG = HERE / 'out' / 'master_gain.json'
DRIVE, MASTER = (lambda d: (d['drive'], d['gain']))(json.loads(_MG.read_text())) if _MG.exists() else (1.6, 1.0)


def render(a, b):
    t0, t1 = a - MARGIN, b + 1.0
    tt = np.arange(int(round((t1 - t0) * SR))) / SR + t0
    r = rng_for('win', a)
    stems = {
        'music': music(tt),
        'beds': beds(tt, r),
        'motion': motion(tt, r),
        'events': events(tt, r),
        'surface': surface(tt, r),
    }
    stems['events'] = stems['events'] + reverb(stems['events'][0] * 0.5 + stems['events'][1] * 0.5, IR_DEEP, 0.35)
    ocean = (tt >= BOUNDARIES['floor']) & (tt < SURFACE_T)
    wet = reverb(stems['beds'][0] * 0.5 + stems['beds'][1] * 0.5, IR_STONE, 0.3)
    wet_o = reverb(stems['beds'][0] * 0.5 + stems['beds'][1] * 0.5, IR_WATER, 0.45)
    stems['beds'] = stems['beds'] + np.where(ocean, wet_o, wet)
    mix = sum(GAINS[k] * v for k, v in stems.items())
    mix = hp(mix, 28)
    mix = compress(mix)
    mix = np.tanh(mix * DRIVE) / np.tanh(1.6) * MASTER  # тот же мягкий ограничитель, что в первых трёх минутах
    keep = (tt >= a - XF) & (tt < b + XF)
    return mix[:, keep], {k: float(20 * np.log10(np.sqrt(np.mean(v[:, keep] ** 2)) + 1e-12)) for k, v in stems.items()}


def write(path, x):
    x = np.clip(x, -1, 1)
    with wave.open(str(path), 'wb') as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((x.T * 32767).astype('<i2').tobytes())


if __name__ == '__main__':
    a, b = float(sys.argv[1]), float(sys.argv[2])
    out_dir = HERE / 'out' / 'deep_audio'
    out_dir.mkdir(parents=True, exist_ok=True)
    mix, levels = render(a, b)
    path = out_dir / f'seg_{int(a)}_{int(b)}.wav'
    write(path, mix)
    print(path.relative_to(HERE.parent), {k: round(v, 1) for k, v in levels.items()}, 'peak', round(float(np.max(np.abs(mix))), 3))
