"""Звук для POV-теста: всё синтезируется с нуля (шум, синусы, фильтры), без чужих записей.

Запуск из корня:  python3 pov/audio.py   ->  pov/out/audio.wav (48 кГц, стерео, 25 с)
События привязаны к раскадровке в pov/timeline.js.
"""
import wave
from pathlib import Path

import numpy as np
from scipy.signal import butter, sosfilt

SR = 48000
DUR = 25.0
N = int(SR * DUR)
t = np.arange(N) / SR
rng = np.random.default_rng(5)


def band(x, lo=None, hi=None, order=4):
    if lo and hi:
        sos = butter(order, [lo, hi], btype='band', fs=SR, output='sos')
    elif lo:
        sos = butter(order, lo, btype='high', fs=SR, output='sos')
    else:
        sos = butter(order, hi, btype='low', fs=SR, output='sos')
    return sosfilt(sos, x)


def env(points):
    """Огибающая по точкам [(секунда, уровень), ...] с линейной интерполяцией."""
    xs, ys = zip(*points)
    return np.interp(t, xs, ys)


def noise():
    return rng.standard_normal(N)


def place(sig, start):
    """Короткий звук в общую дорожку с момента start."""
    out = np.zeros(N)
    i = int(start * SR)
    n = min(len(sig), N - i)
    out[i:i + n] = sig[:n]
    return out


def burst(length, decay, lo=None, hi=None):
    n = int(length * SR)
    x = rng.standard_normal(n) * np.exp(-np.arange(n) / SR / decay)
    return band(x, lo, hi, 2)


def tone(freq, length, attack=0.005, decay=0.08):
    n = int(length * SR)
    tt = np.arange(n) / SR
    return np.sin(2 * np.pi * freq * tt) * np.minimum(1, tt / attack) * np.exp(-tt / decay)


L = np.zeros(N)
R = np.zeros(N)


def add(sig, gain=1.0, pan=0.0):
    """pan: -1 слева … +1 справа (может быть массивом — звук едет)."""
    global L, R
    p = (np.asarray(pan) + 1) / 2
    L += sig * gain * np.cos(p * np.pi / 2)
    R += sig * gain * np.sin(p * np.pi / 2)


above = env([(0, 1), (14.6, 1), (14.8, 0), (DUR, 0)])  # пока голова над землёй
below = 1 - above

# Музыкальная подложка: тихий аккорд, под землёй темнее
pad = np.zeros(N)
for f, a in [(110, 0.5), (164.8, 0.35), (220, 0.25), (246.9, 0.18), (329.6, 0.12)]:
    lfo = 1 + 0.004 * np.sin(2 * np.pi * 0.13 * t + f)
    pad += a * (np.sin(2 * np.pi * f * lfo * t) + 0.25 * np.sin(4 * np.pi * f * lfo * t))
pad_dark = band(pad, hi=380, order=2)
add((pad * above + pad_dark * below) * env([(0, 0), (2.5, 1), (DUR, 1)]), 0.05)

# Город: гул машин и далёкий шум улицы
city = band(noise(), 60, 900, 2) * 0.6 + band(noise(), 900, 5000, 2) * 0.12
add(city * above, 0.09, 0.15 * np.sin(2 * np.pi * 0.05 * t))
for start, f in [(2.2, 415), (5.7, 392)]:  # два далёких сигнала машин
    h = tone(f, 0.35, 0.02, 0.2) + 0.6 * tone(f * 1.26, 0.35, 0.02, 0.2)
    add(place(h, start), 0.025, -0.4)
for k in range(30):  # шаги прохожих
    add(place(burst(0.03, 0.008, 900, 4000), rng.uniform(0.2, 13)), 0.05, rng.uniform(0.2, 0.9))

# Такси проносится слева около 4 с: шум нарастает и уезжает влево
whoosh = band(noise(), 150, 2500, 2) * env([(0, 0), (3.2, 0), (3.95, 1), (4.6, 0.15), (5.4, 0), (DUR, 0)])
add(whoosh, 0.35, env([(0, 0.2), (3.6, 0.1), (4.2, -0.8), (DUR, -0.8)]))

# Асфальт поддаётся (8.6 с): треск, глухой удар, дальше — нарастающий скрежет
add(place(burst(0.5, 0.09, 300, 6000), 8.6), 0.5)
add(place(tone(55, 0.8, 0.002, 0.25), 8.6), 0.6)
grind = band(noise(), 40, 400, 2) * env([(0, 0), (8.6, 0), (9.0, 0.4), (14.6, 1), (14.8, 0.3), (DUR, 0.3)])
add(grind, 0.32)
for k in range(70):  # крошится плитка
    tk = rng.uniform(8.7, 14.6)
    add(place(burst(0.02, 0.006, 1500, 7000), tk), 0.12 * rng.uniform(0.3, 1), rng.uniform(-0.5, 0.5))

# Браслет: короткий двойной сигнал (12.15 с)
chirp = np.concatenate([tone(1760, 0.07, 0.004, 0.05), np.zeros(int(0.03 * SR)), tone(2349, 0.09, 0.004, 0.06)])
add(place(chirp, 12.15), 0.18, -0.3)

# Сквозь асфальт (14.72 с): глухой удар, город глохнет
add(place(tone(48, 1.2, 0.002, 0.4), 14.7), 0.7)
add(place(burst(0.3, 0.08, 80, 600), 14.68), 0.4)

# Под землёй: низкий гул и шорох грунта
drone = band(noise(), 25, 140, 2) + 0.4 * np.sin(2 * np.pi * 41 * t)
add(drone * below, 0.22)
hiss = band(noise(), 2500, 9000, 2) * env([(0, 0), (15.6, 0), (16.1, 1), (16.9, 0.6), (17.4, 0), (DUR, 0)])
add(hiss, 0.09, 0.5)  # пар в трубе справа

# Поезд (17.8–19.9): нарастающий рёв слева, стук колёс, уходит вправо
roar = band(noise(), 120, 1800, 2) + 0.5 * band(noise(), 40, 120, 2)
roar_env = env([(0, 0), (17.6, 0), (18.3, 0.5), (18.6, 1), (19.4, 1), (19.9, 0.25), (20.6, 0), (DUR, 0)])
add(roar * roar_env, 0.55, env([(0, -0.9), (18.3, -0.8), (18.6, -0.2), (19.4, 0.6), (DUR, 0.9)]))
for k in range(24):
    tk = 18.45 + k * 0.045 + (k % 2) * 0.012
    if tk < 19.6:
        add(place(burst(0.04, 0.01, 400, 3000), tk), 0.35, np.clip(-0.6 + k * 0.06, -1, 1))

# Скала: редкие тяжёлые скрипы породы, тихий «звон» на подписи про возраст
for tk in [20.5, 21.3, 22.1]:
    add(place(burst(0.6, 0.18, 50, 300), tk), 0.35, rng.uniform(-0.6, 0.6))
shimmer = sum(tone(f, 2.0, 0.4, 1.2) for f in [1318.5, 1975.5, 2637])
add(place(shimmer, 20.5), 0.02)

# Титр (22.7 с): обратный нарастающий шум и низкий удар
swell = band(noise(), 300, 8000, 2) * env([(0, 0), (21.9, 0), (22.68, 1), (22.7, 0), (DUR, 0)]) ** 2
add(swell, 0.18)
n = int(2.2 * SR)
tt = np.arange(n) / SR
boom = np.sin(2 * np.pi * (60 * tt - 6 * tt ** 2)) * np.exp(-tt / 0.7)
add(place(boom, 22.7), 0.8)

# Сведение: вход и выход, мягкое ограничение, нормализация
master = env([(0, 0), (0.8, 1), (DUR - 0.6, 1), (DUR, 0)])
mix = np.stack([L, R], axis=1) * master[:, None]
mix = np.tanh(mix * 1.8) / 1.8
mix *= 0.89 / np.max(np.abs(mix))

out = Path(__file__).resolve().parent / 'out' / 'audio.wav'
out.parent.mkdir(exist_ok=True)
with wave.open(str(out), 'wb') as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes((mix * 32767).astype('<i2').tobytes())
print(out.relative_to(out.parents[2]))
