"""Звук: процедурная музыка, шумовые эффекты по меткам из сцен, сведение с голосом.

  python sound.py --film burglar      → build/burglar/mix.wav (48 кГц, стерео, около −14 LUFS)

Все звуки синтезируются здесь же (numpy/scipy), без внешних сэмплов.
"""
import json
import os
import subprocess

import numpy as np
from scipy.signal import butter, fftconvolve, sosfilt

HERE = os.path.dirname(os.path.abspath(__file__))
SR = 48000
RNG = np.random.default_rng(17)


# ------------------------------------------------------------------ примитивы
def tt(dur):
    return np.arange(int(dur * SR)) / SR


def noise(dur):
    return RNG.standard_normal(int(dur * SR))


def filt(x, kind, f, order=2):
    if kind == "band":
        sos = butter(order, [max(20, f[0]), min(SR / 2 - 100, f[1])], "bandpass", fs=SR, output="sos")
    else:
        sos = butter(order, min(SR / 2 - 100, f), kind, fs=SR, output="sos")
    return sosfilt(sos, x)


def env(dur, a=0.005, d=None, r=0.05, curve=4.0):
    """Атака a, экспоненциальный спад на всю длительность (или d), хвост r."""
    t = tt(dur)
    e = np.minimum(1.0, t / max(a, 1e-4))
    if d is not None:
        e *= np.exp(-curve * np.maximum(0, t - a) / d)
    if r > 0:
        e *= np.clip((dur - t) / r, 0, 1)
    return e


def sweep(f0, f1, dur, exp=True):
    t = tt(dur)
    if exp:
        f = f0 * (f1 / f0) ** (t / dur)
    else:
        f = f0 + (f1 - f0) * t / dur
    return np.sin(2 * np.pi * np.cumsum(f) / SR)


def tone(f, dur, harm=(1.0,), detune=0.0):
    t = tt(dur)
    out = np.zeros_like(t)
    for n, a in enumerate(harm, 1):
        out += a * np.sin(2 * np.pi * f * n * t * (1 + detune))
    return out


def bell(f, dur=2.2, ratio=3.5, index=2.5, decay=1.1):
    t = tt(dur)
    idx = index * np.exp(-t * 3.0)
    mod = np.sin(2 * np.pi * f * ratio * t)
    x = np.sin(2 * np.pi * f * t + idx * mod)
    x += 0.25 * np.sin(2 * np.pi * f * 2.01 * t) * np.exp(-t * 4)
    return x * np.exp(-t / decay * 2.2) * np.minimum(1, t / 0.002)


def saw_add(f, t, n=8, bright=1.0):
    out = np.zeros_like(t)
    for k in range(1, n + 1):
        out += np.sin(2 * np.pi * f * k * t) / k * (bright ** (k - 1))
    return out


def norm(x, peak=1.0):
    m = np.max(np.abs(x)) + 1e-9
    return x / m * peak


def midi(n):
    return 440.0 * 2 ** ((n - 69) / 12)


# ------------------------------------------------------------------ эффекты
def fx_pop(pitch=1.0, **_):
    d = 0.09
    x = sweep(1100 * pitch, 700 * pitch, d) * env(d, 0.001, 0.05)
    return x * 0.5


def fx_tick(pitch=1.0, **_):
    d = 0.03
    x = filt(noise(d), "high", 3000) * env(d, 0.0005, 0.006) * 0.6
    x += np.sin(2 * np.pi * 2400 * pitch * tt(d)) * env(d, 0.0005, 0.01) * 0.3
    return x


def fx_click(pitch=1.0, **_):
    d = 0.06
    x = filt(noise(d), "band", (1500, 6000)) * env(d, 0.0003, 0.008) * 0.9
    x += np.sin(2 * np.pi * 180 * tt(d)) * env(d, 0.001, 0.02) * 0.5
    return x


def fx_cross(**_):
    d = 0.26
    t = tt(d)
    f = np.where(t < 0.12, 330, 220)
    x = np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)) * 0.25
    x = filt(x, "low", 2500) * env(d, 0.003, None, 0.02) * (np.abs(t - 0.12) > 0.015)
    return x * 0.8


def fx_hit(amp=1.0, **_):
    d = 1.4
    x = sweep(110, 38, d) * env(d, 0.002, 0.45) * 1.0
    x += filt(noise(d), "low", 900) * env(d, 0.001, 0.08) * 0.8
    x += filt(noise(d), "band", (2000, 8000)) * env(d, 0.0005, 0.02) * 0.25
    return np.tanh(x * 1.4) * 0.8 * amp


def fx_boom(amp=1.0, **_):
    d = 3.2
    x = sweep(75, 26, d) * env(d, 0.003, 1.3) * 1.2
    x += filt(noise(d), "low", 400) * env(d, 0.002, 0.5) * 0.9
    x += filt(noise(d), "band", (300, 3000)) * env(d, 0.001, 0.12) * 0.35
    return np.tanh(x * 1.3) * 0.95 * amp


def fx_riser(dur=0.6, **_):
    d = max(0.2, dur)
    t = tt(d)
    n = noise(d)
    x = filt(n, "band", (800, 6000)) * (t / d) ** 2.5 * 0.5
    x += sweep(200, 1400, d) * (t / d) ** 3 * 0.25
    return x


def fx_glitch(amp=0.5, dur=0.12, **_):
    d = max(0.06, dur + 0.05)
    n = int(d * SR)
    x = np.zeros(n)
    pos = 0
    while pos < n:
        seg = int(SR * RNG.uniform(0.008, 0.03))
        kind = RNG.integers(0, 3)
        tseg = np.arange(seg) / SR
        if kind == 0:
            s = np.sign(np.sin(2 * np.pi * RNG.uniform(300, 3000) * tseg))
        elif kind == 1:
            s = RNG.standard_normal(seg)
        else:
            s = np.zeros(seg)
        x[pos:pos + seg] = s[: max(0, min(seg, n - pos))]
        pos += seg
    x = np.round(x * 4) / 4
    return filt(x, "high", 300) * 0.3 * (0.5 + amp) * env(d, 0.001, None, 0.01)


def fx_glitch_long(dur=1.2, **_):
    parts = [fx_glitch(0.6, 0.1) for _ in range(int(dur / 0.12) + 1)]
    x = np.concatenate(parts)[: int(dur * SR)]
    return x * env(len(x) / SR, 0.01, None, 0.2) * 0.8


def fx_whoosh(dur=0.6, **_):
    d = max(0.3, dur)
    t = tt(d)
    n = noise(d)
    shape = np.sin(np.pi * t / d) ** 2
    x = filt(n, "band", (500, 4000)) * shape
    return x * 0.35


def fx_shutter(**_):
    d = 0.16
    x = np.zeros(int(d * SR))
    for off in (0.0, 0.07):
        c = fx_click()
        i = int(off * SR)
        x[i:i + len(c)] += c[: len(x) - i]
    x += filt(noise(d), "band", (2000, 7000)) * env(d, 0.001, 0.05) * 0.2
    return x


def fx_type(dur=0.5, **_):
    x = np.zeros(int((dur + 0.05) * SR))
    t = 0.0
    while t < dur:
        c = fx_tick(pitch=RNG.uniform(0.7, 1.3)) * RNG.uniform(0.5, 1.0)
        i = int(t * SR)
        x[i:i + len(c)] += c[: len(x) - i]
        t += RNG.uniform(0.035, 0.08)
    return x * 0.8


def fx_stamp(**_):
    d = 0.5
    x = np.sin(2 * np.pi * 95 * tt(d)) * env(d, 0.001, 0.08) * 1.2
    x += filt(noise(d), "band", (400, 3500)) * env(d, 0.0005, 0.04) * 0.9
    return np.tanh(x * 1.5) * 0.8


def fx_paper(**_):
    d = 0.45
    n = filt(noise(d), "band", (1500, 7000))
    am = filt(np.abs(noise(d)), "low", 30)
    return n * am * env(d, 0.01, None, 0.1) * 0.5


def motor(dur, f=420.0, wob=0.02, bright=0.6, brush=0.4, rumble=0.3):
    t = tt(dur)
    fm = f * (1 + wob * np.sin(2 * np.pi * 0.7 * t) + 0.004 * filt(noise(dur), "low", 8))
    ph = 2 * np.pi * np.cumsum(fm) / SR
    x = np.sin(ph) * 0.5 + np.sin(2 * ph) * 0.25 * bright + np.sin(3 * ph) * 0.12 * bright
    x += filt(noise(dur), "band", (1800, 6500)) * brush
    x += filt(noise(dur), "low", 180) * rumble
    return x


def fx_vac_drive(dur=2.0, **_):
    d = max(0.4, dur)
    return motor(d, 380) * env(d, 0.25, None, 0.35) * 0.16


def fx_vac_idle(dur=2.0, **_):
    d = max(0.4, dur)
    return motor(d, 300, brush=0.2) * env(d, 0.3, None, 0.4) * 0.09


def fx_vac_stop(**_):
    d = 0.7
    t = tt(d)
    f = 380 * np.exp(-t * 2.5)
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 4) * 0.12
    c = fx_click() * 0.6
    x[:len(c)] += c
    return x


def fx_office_vac(dur=6.0, **_):
    d = max(1.0, dur)
    t = tt(d)
    x = filt(noise(d), "band", (300, 5000)) * 0.6
    ph = 2 * np.pi * np.cumsum(118 * (1 + 0.01 * np.sin(2 * np.pi * 0.3 * t))) / SR
    for k in range(1, 7):
        x += np.sin(k * ph) * 0.35 / k
    x = filt(x, "low", 2500)  # «за стеной»
    return x * env(d, 0.15, None, 0.3) * 0.22


def fx_bump(**_):
    d = 0.25
    return (np.sin(2 * np.pi * 70 * tt(d)) * env(d, 0.001, 0.05) +
            filt(noise(d), "low", 600) * env(d, 0.001, 0.03) * 0.5) * 0.6


def fx_scan(dur=1.0, **_):
    d = max(0.3, dur)
    t = tt(d)
    puls = 0.6 + 0.4 * np.sin(2 * np.pi * 7 * t)
    x = filt(noise(d), "band", (2500, 5000)) * puls * 0.25
    x += np.sin(2 * np.pi * (2900 + 60 * np.sin(2 * np.pi * 7 * t)) * t) * 0.04
    return x * env(d, 0.08, None, 0.2)


def fx_scanbeep(**_):
    d = 0.22
    t = tt(d)
    x = np.sin(2 * np.pi * 1760 * t) * ((t < 0.06) | ((t > 0.1) & (t < 0.16)))
    return x * 0.18


def fx_ping(pitch=1.0, **_):
    d = 1.2
    return np.sin(2 * np.pi * 1250 * pitch * tt(d)) * env(d, 0.002, 0.35) * 0.25


def fx_laser_on(**_):
    d = 0.35
    return sweep(300, 3200, d) * env(d, 0.002, 0.2) * 0.15


def fx_murmur(dur=2.0, **_):
    d = max(0.5, dur)
    t = tt(d)
    syll = 0.5 + 0.5 * np.sin(2 * np.pi * (4.5 + 1.5 * np.sin(2 * np.pi * 0.4 * t)) * t)
    f0 = 120 * (1 + 0.1 * np.sin(2 * np.pi * 1.3 * t))
    src = saw_add(1, np.cumsum(f0) / SR, 12)
    x = filt(src, "band", (300, 900)) + 0.6 * filt(src, "band", (1000, 2200))
    return x * syll * env(d, 0.1, None, 0.3) * 0.18


def fx_data(dur=1.5, **_):
    x = np.zeros(int((dur + 0.1) * SR))
    t = 0.0
    while t < dur:
        f = RNG.choice([1200, 1600, 2000, 2400, 3200])
        d = RNG.uniform(0.015, 0.05)
        b = np.sin(2 * np.pi * f * tt(d)) * env(d, 0.001, None, 0.005) * 0.08
        i = int(t * SR)
        x[i:i + len(b)] += b[: len(x) - i]
        t += RNG.uniform(0.03, 0.09)
    return x


def fx_suck(dur=1.5, **_):
    d = max(0.5, dur)
    t = tt(d)
    f = 420 * (1 - 0.25 * np.minimum(1, t / 0.6))
    x = np.sin(2 * np.pi * np.cumsum(f * (1 + 0.03 * np.sin(2 * np.pi * 9 * t))) / SR) * 0.4
    x += filt(noise(d), "band", (800, 4000)) * 0.6
    return x * env(d, 0.05, None, 0.3) * 0.2


def fx_siren(dur=4.0, **_):
    d = max(1.0, dur)
    t = tt(d)
    f = 700 + 350 * (0.5 + 0.5 * np.sin(2 * np.pi * 0.45 * t))
    x = np.sin(2 * np.pi * np.cumsum(f) / SR)
    x = np.tanh(x * 2) * 0.5
    x = filt(x, "band", (400, 3000))
    return x * np.minimum(1, t / 1.5) * env(d, 0.01, None, 0.4) * 0.12


def fx_creak(dur=0.8, **_):
    d = max(0.3, dur)
    t = tt(d)
    f = 70 * (1 + 0.3 * np.sin(2 * np.pi * 3 * t) + 0.1 * filt(noise(d), "low", 20))
    src = saw_add(1, np.cumsum(f) / SR, 15, 0.9)
    x = filt(src, "band", (600, 1800))
    return x * np.sin(np.pi * t / d) * 0.35


def fx_chime(pitch=1.0, **_):
    d = 1.6
    x = np.zeros(int(d * SR))
    for k, (n, off) in enumerate(((88, 0.0), (84, 0.22))):
        b = bell(midi(n) * pitch, 1.3, ratio=2.0, index=1.2, decay=0.9) * 0.22
        i = int(off * SR)
        x[i:i + len(b)] += b[: len(x) - i]
    return x


def fx_alarm_blip(pitch=1.0, **_):
    d = 0.3
    t = tt(d)
    x = np.sign(np.sin(2 * np.pi * 880 * pitch * t)) * ((t < 0.09) | ((t > 0.14) & (t < 0.23)))
    return filt(x, "low", 3000) * 0.08


def fx_shout(dur=1.2, **_):
    d = max(0.4, dur)
    t = tt(d)
    f0 = 170 * (1 + 0.35 * np.sign(np.sin(2 * np.pi * 3.3 * t)) * np.sin(2 * np.pi * 0.8 * t))
    src = saw_add(1, np.cumsum(f0) / SR, 20, 0.95)
    x = filt(src, "band", (500, 1200)) + 0.8 * filt(src, "band", (1500, 3000))
    syll = (np.sin(2 * np.pi * 5.5 * t) > -0.3).astype(float)
    x = np.tanh(x * 6) * syll
    x = np.round(x * 6) / 6
    return filt(x, "band", (250, 4000)) * env(d, 0.01, None, 0.1) * 0.22


def fx_chase(dur=1.5, **_):
    d = max(0.5, dur)
    x = motor(d, 520, brush=0.5) * 0.15
    t = 0.0
    while t < d:
        c = fx_tick(pitch=0.6) * 0.5
        i = int(t * SR)
        x[i:i + len(c)] += c[: len(x) - i]
        t += 0.09
    return x * env(d, 0.05, None, 0.2)


def fx_steps(dur=2.0, **_):
    x = np.zeros(int((dur + 0.3) * SR))
    t = 0.0
    while t < dur:
        s = fx_bump() * 0.5
        s[: int(0.03 * SR)] += fx_tick(pitch=0.5) * 0.2
        i = int(t * SR)
        x[i:i + len(s)] += s[: len(x) - i]
        t += 0.42
    return x


def fx_door_roll(dur=0.9, **_):
    d = max(0.3, dur)
    t = tt(d)
    rat = 0.5 + 0.5 * np.sign(np.sin(2 * np.pi * 28 * t))
    x = filt(noise(d), "band", (200, 2500)) * rat * 0.35
    x = x * env(d, 0.05, None, 0.05)
    th = fx_bump() * 1.5
    out = np.zeros(len(x) + len(th))
    out[:len(x)] += x
    out[len(x) - 200:len(x) - 200 + len(th)] += th
    return out


def fx_drop(**_):
    d = 1.6
    return sweep(220, 30, d) * env(d, 0.005, 0.7) * 0.5


def fx_dark(**_):
    d = 2.5
    return filt(noise(d), "low", 200) * np.sin(np.pi * tt(d) / d) * 0.25


def fx_drain(dur=2.0, **_):
    d = max(0.5, dur)
    t = tt(d)
    x = filt(noise(d), "band", (150, 900)) * 0.3
    x += sweep(600, 80, d) * 0.1
    for k in range(int(d * 8)):
        b = np.sin(2 * np.pi * RNG.uniform(400, 900) * tt(0.04)) * env(0.04, 0.001, 0.02) * 0.06
        i = int(RNG.uniform(0, d - 0.05) * SR)
        x[i:i + len(b)] += b
    return x * env(d, 0.1, None, 0.5)


def fx_sting(**_):
    d = 3.0
    x = np.zeros(int(d * SR))
    for n in (74, 75, 81):
        x[: int(2.6 * SR)] += bell(midi(n), 2.6, ratio=1.41, index=3.0, decay=1.6) * 0.18
    return x


def fx_heartbeat(dur=4.0, **_):
    x = np.zeros(int((dur + 0.5) * SR))
    t = 0.0
    bpm = 66.0
    while t < dur:
        for off, a in ((0.0, 1.0), (0.24, 0.7)):
            s = np.sin(2 * np.pi * 52 * tt(0.25)) * env(0.25, 0.004, 0.06) * 0.55 * a
            i = int((t + off) * SR)
            x[i:i + len(s)] += s[: len(x) - i]
        t += 60.0 / bpm
        bpm = min(96, bpm + 3)
    return x


def fx_knock(n=3, soft=False, **_):
    gap = 0.32 if not soft else 0.45
    d = gap * n + 0.4
    x = np.zeros(int(d * SR))
    for k in range(n):
        dk = 0.18
        hitk = (np.sin(2 * np.pi * 140 * tt(dk)) * env(dk, 0.001, 0.035) * 0.9 +
                filt(noise(dk), "band", (300, 2500)) * env(dk, 0.0005, 0.02) * 0.8)
        i = int(k * gap * SR)
        x[i:i + len(hitk)] += hitk * (0.45 if soft else 1.0)
    return x * 0.7


def fx_fridge(**_):
    d = 2.2
    x = filt(noise(d), "low", 300) * env(d, 0.002, 0.08) * 0.6
    t = tt(d)
    x += (np.sin(2 * np.pi * 60 * t) * 0.5 + np.sin(2 * np.pi * 120 * t) * 0.3) * np.clip(t / 0.3, 0, 1) * \
        np.clip((d - t) / 0.5, 0, 1) * 0.12
    c = fx_click() * 0.5
    x[:len(c)] += c
    return x


def fx_drawer(**_):
    d = 0.6
    t = tt(d)
    x = filt(noise(d), "band", (200, 1800)) * (0.5 + 0.5 * np.sin(2 * np.pi * 23 * t)) * np.sin(np.pi * t / d) * 0.4
    b = fx_bump() * 0.6
    x[-len(b):] += b[: len(x)]
    return x


def fx_door_close(**_):
    d = 0.5
    x = np.sin(2 * np.pi * 85 * tt(d)) * env(d, 0.002, 0.12) * 0.9
    x += filt(noise(d), "low", 1200) * env(d, 0.001, 0.05) * 0.6
    c = fx_click()
    x[int(0.04 * SR):int(0.04 * SR) + len(c)] += c * 0.6
    return np.tanh(x * 1.3) * 0.7


def fx_lock(**_):
    d = 0.25
    x = np.zeros(int(d * SR))
    for off in (0.0, 0.09):
        c = fx_click() * 0.9
        i = int(off * SR)
        x[i:i + len(c)] += c[: len(x) - i]
    return x


def fx_scrape(dur=1.0, pitch=1.0, **_):
    d = max(0.3, dur)
    t = tt(d)
    jitter = 1 + 0.3 * filt(noise(d), "low", 15)
    x = filt(noise(d), "band", (120 * pitch, 900 * pitch)) * jitter
    src = saw_add(1, np.cumsum(55 * pitch * jitter) / SR, 10, 0.8)
    x += filt(src, "band", (200, 1200)) * 0.4
    return x * env(d, 0.05, None, 0.15) * 0.35


def fx_coin(**_):
    d = 0.8
    x = np.zeros(int(d * SR))
    for k, f in enumerate((4200, 5300, 6100)):
        x += np.sin(2 * np.pi * f * tt(d)) * env(d, 0.001, 0.25) * 0.05
    x[: int(0.4 * SR)] += fx_scrape(0.4, 3.0)[: int(0.4 * SR)] * 0.4
    return x


def fx_dtmf(key="9", **_):
    lo = {"1": 697, "2": 697, "3": 697, "4": 770, "5": 770, "6": 770, "7": 852, "8": 852, "9": 852, "*": 941,
          "0": 941, "#": 941}[key]
    hi = {"1": 1209, "4": 1209, "7": 1209, "*": 1209, "2": 1336, "5": 1336, "8": 1336, "0": 1336, "3": 1477,
          "6": 1477, "9": 1477, "#": 1477}[key]
    d = 0.16
    t = tt(d)
    return (np.sin(2 * np.pi * lo * t) + np.sin(2 * np.pi * hi * t)) * env(d, 0.004, None, 0.02) * 0.07


def fx_vibrate(**_):
    d = 0.5
    t = tt(d)
    x = np.sin(2 * np.pi * 160 * t) * (np.sin(2 * np.pi * 8 * t) > 0) * 0.25
    return filt(x, "low", 600) * env(d, 0.01, None, 0.05)


def fx_message(**_):
    d = 0.35
    return sweep(600, 1400, d) * env(d, 0.003, 0.15) * 0.12


def fx_house_alarm(dur=2.0, **_):
    d = max(0.5, dur)
    t = tt(d)
    f = np.where((t * 2) % 1 < 0.5, 1800, 1400)
    x = np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR))
    return filt(x, "low", 4000) * env(d, 0.01, None, 0.1) * 0.06


def fx_horn(dur=1.6, **_):
    d = max(0.4, dur)
    t = tt(d)
    on = ((t * 2.2) % 1 < 0.55).astype(float)
    src = saw_add(1, t * 400, 12, 0.85) + saw_add(1, t * 500, 12, 0.85)
    x = filt(src, "band", (300, 3000)) * on
    return x * env(d, 0.01, None, 0.05) * 0.12


def fx_rewind(dur=0.8, **_):
    d = max(0.3, dur)
    t = tt(d)
    x = sweep(1800, 300, d) * 0.15 + filt(noise(d), "band", (2000, 8000)) * 0.2 * (0.5 + 0.5 * np.sin(2 * np.pi * 30 * t))
    return x * env(d, 0.02, None, 0.05)


def fx_water(dur=1.5, **_):
    d = max(0.3, dur)
    x = filt(noise(d), "band", (800, 5000)) * (0.6 + 0.4 * filt(np.abs(noise(d)), "low", 12))
    return x * env(d, 0.1, None, 0.3) * 0.2


def fx_clock(dur=4.0, **_):
    x = np.zeros(int((dur + 0.1) * SR))
    t = 0.0
    k = 0
    while t < dur:
        c = fx_tick(pitch=0.55 if k % 2 else 0.6) * 0.5
        i = int(t * SR)
        x[i:i + len(c)] += c[: len(x) - i]
        t += 1.0
        k += 1
    return x


def fx_meow(**_):
    d = 0.7
    t = tt(d)
    f = 550 + 250 * np.sin(np.pi * t / d)
    src = saw_add(1, np.cumsum(f) / SR, 10, 0.8)
    x = filt(src, "band", (700, 2500)) * np.sin(np.pi * t / d) ** 2
    return x * 0.18


def fx_siren_far(dur=4.0, **_):
    return fx_siren(dur) * 0.6


def fx_car_door(**_):
    return fx_door_close() * 0.8


def fx_boots(dur=2.0, **_):
    x = np.zeros(int((dur + 0.3) * SR))
    t = 0.0
    while t < dur:
        s = fx_bump() * 0.9
        i = int(t * SR)
        x[i:i + len(s)] += s[: len(x) - i]
        t += 0.34
    return x


def fx_whisper(dur=1.5, **_):
    d = max(0.4, dur)
    t = tt(d)
    syll = 0.5 + 0.5 * np.sin(2 * np.pi * 5 * t)
    x = filt(noise(d), "band", (1500, 6000)) * syll
    return x * env(d, 0.05, None, 0.2) * 0.12


def fx_radio(dur=1.0, **_):
    d = max(0.3, dur)
    x = filt(noise(d), "band", (500, 3500)) * 0.25 + fx_murmur(d)[: int(d * SR)] * 1.5
    return np.tanh(x * 3) * 0.15 * env(d, 0.01, None, 0.05)


# мелодия-«колыбельная» (тема канала)
THEME = [(69, 0.0), (74, 0.32), (77, 0.64), (76, 0.96), (74, 1.28), (69, 1.6), (73, 1.92), (74, 2.4)]


def theme(scale=1.0, notes=None, gain=0.3, octave=0):
    notes = notes or THEME
    d = notes[-1][1] * scale + 2.8
    x = np.zeros(int(d * SR))
    for n, off in notes:
        b = bell(midi(n + octave), 2.6, ratio=3.0, index=1.6, decay=1.3) * gain
        b += bell(midi(n + octave + 12), 2.6, ratio=3.0, index=0.8, decay=0.7) * gain * 0.25
        i = int(off * scale * SR)
        x[i:i + len(b)] += b[: len(x) - i]
    return x


def fx_theme(**_):
    return theme(1.0, gain=0.26)


def fx_theme_hit(**_):
    return theme(0.8, THEME[:4], gain=0.2, octave=-12)


def fx_theme_end(**_):
    return theme(1.25, gain=0.24)


FX = {k[3:]: v for k, v in globals().items() if k.startswith("fx_")}
WET = {"theme": 0.9, "theme_hit": 0.9, "theme_end": 1.0, "chime": 0.5, "boom": 0.4, "hit": 0.35, "ping": 0.6,
       "sting": 0.9, "pop": 0.15, "stamp": 0.25, "heartbeat": 0.1, "cross": 0.15, "drop": 0.4}
# громкость эффектов относительно голоса (подобрано по RMS/пикам, см. STEMS=1)
GAIN = {"pop": 0.4, "tick": 0.5, "click": 0.3, "shutter": 0.3, "type": 0.4, "paper": 0.25, "cross": 0.3,
        "glitch": 0.22, "glitch_long": 0.25, "hit": 0.6, "boom": 0.7, "riser": 0.5, "stamp": 0.6,
        "theme": 0.6, "theme_end": 0.5, "theme_hit": 0.6, "vac_drive": 0.6, "vac_idle": 0.8, "office_vac": 0.8,
        "scan": 0.6, "suck": 0.7, "chase": 0.7, "shout": 0.6, "murmur": 0.8, "heartbeat": 0.6,
        "door_roll": 0.5, "drain": 0.6, "whoosh": 0.6, "chime": 0.8, "sting": 0.8, "bump": 0.6, "drop": 0.8,
        "scanbeep": 0.7, "vac_stop": 0.6, "alarm_blip": 0.8,
        "knock": 0.7, "fridge": 0.8, "drawer": 0.6, "door_close": 0.6, "lock": 0.6, "scrape": 0.7, "coin": 0.8,
        "vibrate": 0.6, "message": 0.8, "horn": 0.6, "rewind": 0.5, "water": 0.6, "clock": 0.4, "meow": 0.8,
        "car_door": 0.6, "boots": 0.5, "whisper": 0.8, "radio": 0.8}


# ------------------------------------------------------------------ музыка
def music(dur, tl, cfg):
    """Тёмная подложка: гул на тонике, аккорды, верхний «звон»; интенсивность по репликам (cfg из сценария)."""
    t = tt(dur)
    starts = {L["id"]: L["start"] for L in tl["lines"]}
    r7 = starts["r7"]
    hold = starts[cfg["hold"]]

    def curve(points):
        xs, ys = zip(*points)
        return np.interp(t, xs, ys)

    pts = [(0, 0.0), (1.0, 0.55)] + [(starts[lid] + off, v) for lid, off, v in cfg["curve"]]
    pts += [(hold - 0.05, 0.9), (hold, 0.0), (dur, 0.0)]
    inten = curve(sorted(pts))
    root = cfg["root"]
    x = np.zeros_like(t)
    # гул: тоника, октава и квинта с медленно «дышащим» тембром
    for f, a in ((root, 0.55), (root * 2, 0.45), (root * 3, 0.18)):
        for k in range(1, 7):
            lfo = 0.5 + 0.5 * np.sin(2 * np.pi * (0.03 + 0.01 * k) * t + k)
            x += a / k * lfo * np.sin(2 * np.pi * f * k * t + k)
    x *= 0.5
    # аккорды по 9 секунд, с плавной сменой
    chords = cfg["chords"]
    seg = 9.0
    pad = np.zeros_like(t)
    for i in range(int(dur / seg) + 1):
        notes = chords[i % len(chords)]
        a0 = i * seg - 2.0
        a1 = a0 + seg + 4.0
        mask = (t >= a0) & (t < a1)
        if not mask.any():
            continue
        tl_ = t[mask]
        e = np.sin(np.pi * np.clip((tl_ - a0) / (a1 - a0), 0, 1)) ** 1.5
        for n in notes:
            f = midi(n - 12)
            for det in (-0.004, 0.0, 0.005):
                pad[mask] += saw_add(f * (1 + det), tl_, 6, 0.55) * e * 0.06
    pad = filt(pad, "low", 1400)
    x += pad
    # верхний звон в напряжённых местах
    top = midi(chords[0][0] + 24)
    shimmer = (np.sin(2 * np.pi * top * t) + 0.7 * np.sin(2 * np.pi * top * 1.4983 * t * 1.001)) * 0.012
    shimmer *= 0.5 + 0.5 * np.sin(2 * np.pi * 0.21 * t)
    shimmer *= curve([(0, 0.6), (starts["i1"], 0.2), (r7, 0.9), (hold, 0.9), (hold + 0.01, 0)])
    x += shimmer
    return x * inten


# ------------------------------------------------------------------ сведение
def load_voice(build):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", os.path.join(build, "voice.wav"), "-f", "f32le", "-ac", "1",
                          "-ar", str(SR), "-"], capture_output=True, check=True).stdout
    return np.frombuffer(raw, dtype=np.float32).astype(np.float64)


def envelope(x, att=0.02, rel=0.35):
    a = np.abs(x)
    hop = 240
    n = len(a) // hop
    blk = a[: n * hop].reshape(n, hop).max(1)
    out = np.zeros(n)
    ka, kr = np.exp(-hop / SR / att), np.exp(-hop / SR / rel)
    v = 0.0
    for i, s in enumerate(blk):
        k = ka if s > v else kr
        v = k * v + (1 - k) * s
        out[i] = v
    full = np.repeat(out, hop)
    return np.pad(full, (0, max(0, len(x) - len(full))), mode="edge")[: len(x)]


def reverb_ir(dur=2.6):
    t = tt(dur)
    l = RNG.standard_normal(len(t)) * np.exp(-t * 6.9 / 2.2)
    r = RNG.standard_normal(len(t)) * np.exp(-t * 6.9 / 2.2)
    l, r = filt(l, "low", 5000), filt(r, "low", 5000)
    pre = int(0.02 * SR)
    l = np.concatenate([np.zeros(pre), l])
    r = np.concatenate([np.zeros(pre), r])
    return l / np.sqrt((l ** 2).sum()), r / np.sqrt((r ** 2).sum())


def main():
    import argparse
    import importlib
    import sys
    global THEME
    ap = argparse.ArgumentParser()
    ap.add_argument("--film", default="vacuum")
    args = ap.parse_args()
    sys.path.insert(0, HERE)
    from render import build_stage

    script = importlib.import_module(f"films.{args.film}.script")
    cfg = script.MUSIC
    THEME = cfg["theme"]
    build = os.path.join(HERE, "build", args.film)
    S = build_stage(args.film)
    tl = S.tl
    voice = load_voice(build)
    dur = max(len(voice) / SR, tl["duration"]) + 3.0
    n = int(dur * SR)
    voice = np.pad(voice, (0, n - len(voice)))

    sfx = np.zeros((2, n))
    wet = np.zeros((2, n))
    long_kinds = {"vac_drive", "vac_idle", "office_vac", "siren", "scan", "suck", "chase", "murmur", "house_alarm",
                  "horn", "siren_far", "water", "steps", "boots", "clock", "whisper", "radio"}
    duck_sfx = np.zeros(n)
    for cue in sorted(S.cues, key=lambda c: c["t"]):
        kind = cue["kind"]
        fn = FX.get(kind)
        if fn is None:
            continue
        x = fn(**{k: v for k, v in cue.items() if k not in ("t", "kind")}) * GAIN.get(kind, 1.0)
        i = int(cue["t"] * SR)
        if i >= n:
            continue
        x = x[: n - max(0, i)]
        if i < 0:
            x, i = x[-i:], 0
        pan = cue.get("pan", (RNG.uniform(-0.25, 0.25) if kind in ("pop", "tick", "type") else 0.0))
        lg, rg = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
        sfx[0, i:i + len(x)] += x * lg * 1.2
        sfx[1, i:i + len(x)] += x * rg * 1.2
        if kind in long_kinds:
            duck_sfx[i:i + len(x)] = 1.0
        w = WET.get(kind, 0.12)
        wet[0, i:i + len(x)] += x * w
        wet[1, i:i + len(x)] += x * w

    mus = music(dur, tl, cfg)
    venv = envelope(voice)
    duck = 1 - 0.5 * np.clip(venv / 0.12, 0, 1)
    mus *= duck
    # длинные эффекты тоже чуть уходят под голос
    sfx *= 1 - 0.35 * np.clip(venv / 0.12, 0, 1) * duck_sfx
    # широкая стереобаза для музыки: задержка 11 мс в правом канале
    d = int(0.011 * SR)
    mus_st = np.stack([mus, np.concatenate([np.zeros(d), mus[:-d]])]) * 0.32
    wet += mus_st * 0.2
    irl, irr = reverb_ir()
    rev = np.stack([fftconvolve(wet[0], irl)[:n], fftconvolve(wet[1], irr)[:n]]) * 0.5

    # «HOLD STILL»: всё стихает, кроме финального удара
    hold = S.at(cfg["hold"])
    fade = np.ones(n)
    k0 = int((hold - 0.02) * SR)
    fade[k0:] = 0.0
    mus_st *= fade
    rev *= np.maximum(fade, np.exp(-np.maximum(0, np.arange(n) - k0) / SR * 1.2))

    if os.environ.get("STEMS"):
        def db(x):
            return 20 * np.log10(np.sqrt((x ** 2).mean()) + 1e-12)
        print(f"voice {db(voice):.1f}  music {db(mus_st):.1f}  sfx {db(sfx):.1f}  reverb {db(rev):.1f}")
        for kind in sorted({c["kind"] for c in S.cues}):
            if kind in FX:
                cue = next(c for c in S.cues if c["kind"] == kind)
                x = FX[kind](**{k: v for k, v in cue.items() if k not in ("t", "kind")}) * GAIN.get(kind, 1.0) * 1.2
                print(f"  {kind:12s} rms {db(x):6.1f}  peak {20 * np.log10(np.abs(x).max() + 1e-12):6.1f}")
    room = filt(noise(dur), "low", 600) * 0.0025
    mix = np.stack([voice, voice]) * 1.0 + sfx + mus_st + rev + room
    # мягкий лимитер
    peak = np.max(np.abs(mix))
    mix = np.tanh(mix / max(1.0, peak * 0.9) * 1.1) * 0.95
    raw = os.path.join(build, "mix_raw.f32")
    mix.T.astype(np.float32).tofile(raw)
    out = os.path.join(build, "mix.wav")
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", "2", "-i", raw,
                    "-af", "loudnorm=I=-14:TP=-1.2:LRA=9", "-ar", str(SR), out], check=True)
    print("→", out, f"{dur:.1f}s, cues: {len(S.cues)}")


if __name__ == "__main__":
    main()
