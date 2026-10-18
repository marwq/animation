"""Звук: синтез музыки по настроению сегмента, звуковые эффекты, сведение с озвучкой.

python tools/audio.py            → build/audio/mix.wav (48 кГц, стерео)
Музыка и эффекты синтезируются здесь же (без сторонних сэмплов), озвучка берётся
из build/voice/timing.json.
"""
import json
import math
import os
import zlib
import subprocess
import sys

import numpy as np
import soundfile as sf
from scipy import signal

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT)
SR = 48000
OUT = os.path.join(ROOT, "build", "audio")
rng = np.random.default_rng(7)


# --- базовые генераторы ---------------------------------------------------------

def t_(dur):
    return np.arange(int(dur * SR)) / SR


def env_adsr(n, a=0.01, d=0.1, s=0.7, r=0.2):
    e = np.ones(n) * s
    na, nd, nr = int(a * SR), int(d * SR), int(r * SR)
    na = min(na, n)
    e[:na] = np.linspace(0, 1, na)
    nd = min(nd, n - na)
    e[na:na + nd] = np.linspace(1, s, nd)
    nr = min(nr, n)
    e[n - nr:] *= np.linspace(1, 0, nr)
    return e


def lp(x, f, order=2):
    b, a = signal.butter(order, min(f / (SR / 2), 0.99), "low")
    return signal.lfilter(b, a, x)


def hp(x, f, order=2):
    b, a = signal.butter(order, min(f / (SR / 2), 0.99), "high")
    return signal.lfilter(b, a, x)


def bp(x, f0, f1, order=2):
    b, a = signal.butter(order, [f0 / (SR / 2), min(f1 / (SR / 2), 0.99)], "band")
    return signal.lfilter(b, a, x)


def saw(f, dur, phase=0.0):
    t = t_(dur)
    return 2 * ((t * f + phase) % 1.0) - 1


def midi(n):
    return 440.0 * 2 ** ((n - 69) / 12)


NOTE = {"C": 0, "C#": 1, "Db": 1, "D": 2, "D#": 3, "Eb": 3, "E": 4, "F": 5, "F#": 6, "Gb": 6, "G": 7, "G#": 8,
        "Ab": 8, "A": 9, "A#": 10, "Bb": 10, "B": 11}


def nm(s):
    """'A4' → midi."""
    name, octv = s[:-1], int(s[-1])
    return 12 * (octv + 1) + NOTE[name]


def chord(root, kind="m", octv=3):
    r = nm(root + str(octv))
    iv = {"m": [0, 3, 7], "M": [0, 4, 7], "m7": [0, 3, 7, 10], "M7": [0, 4, 7, 11], "sus": [0, 5, 7],
          "add9": [0, 4, 7, 14], "dim": [0, 3, 6]}[kind]
    return [r + i for i in iv]


# --- инструменты -----------------------------------------------------------------

def pad(notes, dur, bright=1200, amp=0.12):
    x = np.zeros(int(dur * SR))
    for n in notes:
        f = midi(n)
        for det in (-0.006, 0.0, 0.007):
            x += saw(f * (1 + det), dur, rng.random())
    x = lp(x, bright) * amp / max(1, len(notes))
    return x * env_adsr(len(x), a=min(1.5, dur * 0.3), d=0.5, s=0.9, r=min(1.5, dur * 0.3))


def piano(n, dur=2.0, amp=0.25):
    f = midi(n)
    t = t_(dur)
    x = np.zeros_like(t)
    for h, a in ((1, 1.0), (2, 0.5), (3, 0.25), (4, 0.12), (5, 0.06)):
        x += a * np.sin(2 * np.pi * f * h * (1 + 0.0004 * h * h) * t) * np.exp(-t * (2.2 + h * 0.9))
    x *= amp
    x[:200] *= np.linspace(0, 1, 200)
    return x


def pluck(n, dur=0.5, amp=0.25, bright=1.0):
    f = midi(n)
    t = t_(dur)
    x = np.sin(2 * np.pi * f * t) + 0.3 * bright * np.sin(2 * np.pi * f * 4 * t) * np.exp(-t * 30)
    x *= np.exp(-t * 9) * amp
    x[:60] *= np.linspace(0, 1, 60)
    return x


def bass(n, dur=0.5, amp=0.35):
    f = midi(n)
    x = np.sin(2 * np.pi * f * t_(dur)) + 0.25 * saw(f, dur)
    x = lp(x, 400) * amp
    return x * env_adsr(len(x), 0.005, 0.1, 0.8, 0.08)


def strings(notes, dur, amp=0.08):
    x = np.zeros(int(dur * SR))
    t = t_(dur)
    for n in notes:
        f = midi(n)
        vib = 1 + 0.004 * np.sin(2 * np.pi * 5.2 * t + rng.random() * 6)
        ph = np.cumsum(f * vib) / SR
        x += 2 * (ph % 1.0) - 1
    x = bp(x, 300, 4000) * amp / max(1, len(notes))
    return x * env_adsr(len(x), a=dur * 0.45, d=0.1, s=1.0, r=dur * 0.3)


def kick(amp=0.6, dur=0.4):
    t = t_(dur)
    f = 45 + 90 * np.exp(-t * 30)
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 9)
    return x * amp


def noise(dur, amp=1.0):
    return rng.standard_normal(int(dur * SR)) * amp


def shaker(amp=0.08):
    x = hp(noise(0.08), 6000) * np.exp(-t_(0.08) * 50)
    return x * amp


def tom(n=45, amp=0.4, dur=0.5):
    t = t_(dur)
    f = midi(n) * (1 + 0.5 * np.exp(-t * 20))
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 6) * amp


def heartbeat(amp=0.5):
    x = np.zeros(int(0.8 * SR))
    k = kick(amp, 0.3)
    x[:len(k)] += lp(k, 120)
    k2 = kick(amp * 0.7, 0.3)
    s = int(0.22 * SR)
    x[s:s + len(k2)] += lp(k2, 120)
    return x


def place(buf, x, t, gain=1.0):
    i = int(t * SR)
    if i >= len(buf) or i + len(x) <= 0:
        return
    a = max(0, -i)
    j = min(len(buf), i + len(x))
    buf[max(0, i):j] += x[a:a + (j - max(0, i))] * gain


def movavg(x, k):
    """Скользящее среднее (через накопленную сумму — быстро на длинных сигналах)."""
    k = max(1, int(k))
    c = np.cumsum(np.concatenate([np.zeros(1), x]))
    y = (c[k:] - c[:-k]) / k
    pad_l = (len(x) - len(y)) // 2
    return np.concatenate([np.full(pad_l, y[0]), y, np.full(len(x) - len(y) - pad_l, y[-1])])


def reverb(x, seconds=2.2, mix=0.25):
    n = int(seconds * SR)
    ir = rng.standard_normal(n) * np.exp(-np.arange(n) / SR * (6.9 / seconds))
    ir = lp(ir, 5000)
    ir /= np.sqrt(np.sum(ir ** 2)) + 1e-9
    wet = signal.oaconvolve(x, ir)[:len(x)]
    return x * (1 - mix) + wet * mix * 1.6


# --- музыка по настроениям ------------------------------------------------------------

PROG = {
    "lonely": [("A", "m"), ("F", "M"), ("C", "M"), ("G", "M")],
    "hope": [("F", "M"), ("C", "M"), ("D", "m"), ("Bb", "M")],
    "fun": [("C", "M"), ("A", "m"), ("F", "M"), ("G", "M")],
    "wonder": [("D", "M7"), ("B", "m7"), ("G", "M7"), ("A", "add9")],
    "tension": [("D", "m"), ("D", "m"), ("Bb", "M"), ("A", "M")],
    "mystery": [("C", "m"), ("Ab", "M"), ("C", "m"), ("G", "M")],
    "action": [("D", "m"), ("Bb", "M"), ("C", "M"), ("A", "M")],
    "storm": [("E", "m"), ("C", "M"), ("E", "m"), ("B", "M")],
}
TEMPO = {"lonely": 72, "hope": 80, "fun": 112, "wonder": 76, "tension": 100, "mystery": 66, "action": 138,
         "storm": 90}


def music(mood, dur, seed=0, intensity=1.0):
    """Кусок музыки заданного настроения (моно, без реверба)."""
    global rng
    rng = np.random.default_rng(seed)
    bpm = TEMPO[mood]
    beat = 60 / bpm
    bar = beat * 4
    x = np.zeros(int((dur + 3) * SR))
    prog = PROG[mood]
    nbars = int(dur / bar) + 2
    for b in range(nbars):
        root, kind = prog[b % len(prog)]
        ch = chord(root, kind, 3)
        t0 = b * bar
        if mood in ("lonely", "hope", "wonder"):
            place(x, pad([n + 12 for n in ch], bar + 0.6, 1400, 0.10), t0)
            arp = ch + [ch[0] + 12, ch[1] + 12]
            for k in range(8 if mood != "lonely" else 4):
                step = bar / (8 if mood != "lonely" else 4)
                n = arp[(k * 2 + b) % len(arp)] + 12
                place(x, piano(n, 2.2, 0.16 if mood != "wonder" else 0.11), t0 + k * step)
            place(x, bass(ch[0] - 12, bar * 0.9, 0.22), t0)
            if mood == "hope" and intensity > 0.6:
                place(x, strings([n + 12 for n in ch], bar + 0.4, 0.07 * intensity), t0)
            if mood == "wonder":
                for k in range(4):
                    place(x, pluck(ch[k % 3] + 24 + (5 if k == 3 else 0), 0.8, 0.07), t0 + k * beat + beat / 2)
        elif mood == "fun":
            place(x, pad([n + 12 for n in ch], bar, 900, 0.05), t0)
            for k in range(8):
                n = ch[[0, 1, 2, 1, 0, 2, 1, 2][k]] + 12 + (12 if k in (3, 7) else 0)
                place(x, pluck(n, 0.4, 0.17), t0 + k * beat / 2)
            for k in range(4):
                place(x, bass(ch[0] - 12 + (7 if k % 2 else 0), beat * 0.45, 0.28), t0 + k * beat)
                place(x, shaker(0.06), t0 + k * beat + beat / 2)
            place(x, kick(0.25), t0)
            place(x, kick(0.2), t0 + 2 * beat)
        elif mood in ("tension", "mystery", "storm"):
            place(x, pad([ch[0], ch[0] + 7, ch[0] + 13], bar + 0.8, 600, 0.10), t0)
            if mood == "tension":
                for k in range(8):
                    place(x, bass(ch[0] - 12, beat * 0.3, 0.22 * intensity), t0 + k * beat / 2)
                if b % 2 == 1:
                    place(x, heartbeat(0.35 * intensity), t0 + beat)
                place(x, strings([ch[0] + 24, ch[0] + 25], bar + 0.5, 0.035 * intensity), t0)
            elif mood == "mystery":
                for k in range(2):
                    n = ch[0] + 24 + [0, 6, 3, 10][(b + k) % 4]
                    place(x, piano(n, 3.0, 0.10), t0 + k * bar / 2 + beat * 0.5)
                place(x, bass(ch[0] - 12, bar * 0.9, 0.16), t0)
            else:
                place(x, tom(40, 0.35 * intensity, 1.0), t0)
                place(x, tom(40, 0.25 * intensity, 1.0), t0 + beat * 2.5)
                place(x, strings([ch[0] + 12, ch[1] + 12], bar + 0.5, 0.05), t0)
        elif mood == "action":
            place(x, pad([n + 12 for n in ch], bar, 1000, 0.06), t0)
            for k in range(8):
                place(x, bass(ch[0] - 12 + (12 if k % 4 == 3 else 0), beat * 0.4, 0.3), t0 + k * beat / 2)
            for k in range(4):
                place(x, kick(0.5 * intensity), t0 + k * beat)
                place(x, shaker(0.07), t0 + k * beat + beat / 2)
            if b % 2 == 1:
                for k in range(4):
                    place(x, tom(45 - k * 2, 0.3 * intensity, 0.4), t0 + 3 * beat + k * beat / 4)
            place(x, strings([ch[0] + 24, ch[2] + 12], bar, 0.06 * intensity), t0)
    x = x[:int(dur * SR)]
    return x


# сегмент → [(с секунды, настроение, интенсивность)]
MOODS = {
    "cold": [(0, "tension", 1.0)], "d01": [(0, "tension", 0.8), (17, "action", 0.9)], "d02": [(0, "wonder", 1)],
    "d03": [(0, "lonely", 1)], "d04": [(0, "tension", 0.6), (21, "mystery", 0.6)], "d05": [(0, "mystery", 0.5),
                                                                                         (12, "fun", 1)],
    "d06": [(0, "mystery", 1)], "d07": [(0, "fun", 1)], "d08": [(0, "fun", 1)], "d09": [(0, "fun", 0.8),
                                                                                   (11, "wonder", 1),
                                                                                   (18, "lonely", 1)],
    "d10": [(0, "hope", 0.6), (24, "tension", 0.7)], "d11": [(0, "lonely", 1), (20.5, "tension", 1.0)],
    "d12": [(0, "lonely", 0.8)], "d13": [(0, "tension", 0.9)], "d14": [(0, "mystery", 1)], "d15": [(0, "fun", 1)],
    "d16": [(0, "tension", 0.6), (11, "action", 0.8), (25, "fun", 0.8)], "d17": [(0, "hope", 0.7),
                                                                                 (14, "lonely", 1)],
    "d18": [(0, "wonder", 1)], "d19": [(0, "lonely", 1), (16, "hope", 0.8)], "d20": [(0, "tension", 0.5),
                                                                                       (10, "hope", 0.7)],
    "d21": [(0, "fun", 0.8)], "d22": [(0, "hope", 1.0)], "d23": [(0, "tension", 0.8), (18, "lonely", 1)],
    "d24": [(0, "lonely", 1), (17, "storm", 0.6)], "d25": [(0, "storm", 1)], "d26": [(0, "storm", 1),
                                                                                       (10, "tension", 1)],
    "d27": [(0, "tension", 0.6)], "d28": [(0, "tension", 1), (15, "action", 1)], "d29": [(0, "action", 1),
                                                                                         (21, "tension", 1)],
    "d30": [(0, "action", 1), (9, "hope", 1)], "epi": [(0, "hope", 1)], "end": [(0, "hope", 0.6)],
}


def segment_music(key, dur, seed):
    parts = MOODS.get(key, [(0, "lonely", 1)])
    out = np.zeros(int(dur * SR))
    for i, (t0, mood, inten) in enumerate(parts):
        t1 = parts[i + 1][0] if i + 1 < len(parts) else dur
        a, b = max(0, t0 - 0.8), min(dur, t1 + 0.8)
        m = music(mood, b - a, seed * 10 + i, inten)
        fade = int(0.8 * SR)
        e = np.ones(len(m))
        if i > 0:
            e[:fade] = np.linspace(0, 1, fade)
        if i + 1 < len(parts):
            e[-fade:] = np.linspace(1, 0, fade)
        place(out, m * e, a)
    return out


# --- эффекты -------------------------------------------------------------------------

def sfx(name):
    global rng
    rng = np.random.default_rng(zlib.crc32(name.encode()))
    if name == "whoosh":
        d = 0.6
        x = noise(d)
        f = np.linspace(400, 3000, len(x))
        y = np.zeros_like(x)
        for k in range(0, len(x), 2400):
            seg = x[k:k + 2400]
            y[k:k + 2400] = bp(seg, f[k] * 0.6, f[k] * 1.4, 1)
        return y * np.sin(np.linspace(0, np.pi, len(y))) * 0.25
    if name in ("metal_hit", "hatch_bang", "gate_slam", "door_bang", "door_burst"):
        d = 1.2
        t = t_(d)
        x = noise(d) * np.exp(-t * 25) * 0.6
        for f in (180, 410, 730, 1130):
            x += np.sin(2 * np.pi * f * t) * np.exp(-t * (4 + f / 300)) * 0.25
        x += kick(0.8, d)
        if name == "gate_slam":
            for k in range(6):
                place(x, noise(0.05) * 0.2, 0.05 + k * 0.06)
        return lp(x, 6000) * 0.7
    if name in ("bucket_crash",):
        t = t_(0.9)
        x = noise(0.9) * np.exp(-t * 12) * 0.5 + np.sin(2 * np.pi * 320 * t) * np.exp(-t * 6) * 0.3
        x += lp(noise(0.9), 800) * np.exp(-((t - 0.25) ** 2) / 0.01) * 0.6
        return x * 0.8
    if name == "glass_bang":
        t = t_(1.5)
        x = kick(1.0, 1.5) + lp(noise(1.5), 2500) * np.exp(-t * 8) * 0.8
        for f in (1900, 2700, 3900):
            x += np.sin(2 * np.pi * f * t) * np.exp(-t * 7) * 0.08
        return x
    if name == "keys":
        x = np.zeros(int(1.0 * SR))
        for k in range(10):
            t = t_(0.3)
            f = rng.uniform(2500, 5000)
            place(x, np.sin(2 * np.pi * f * t) * np.exp(-t * 25) * 0.15, k * 0.06 + rng.uniform(0, 0.03))
        return x
    if name in ("notify", "ding"):
        x = np.zeros(int(1.4 * SR))
        notes = [nm("E6"), nm("B6")] if name == "notify" else [nm("C6")]
        for i, n in enumerate(notes):
            place(x, piano(n, 1.2, 0.35), i * 0.12)
        return x
    if name == "bark":
        x = np.zeros(int(0.6 * SR))
        for k in range(2):
            t = t_(0.14)
            f = 520 * (1 - 0.35 * t / 0.14)
            ph = np.cumsum(f) / SR
            s = (2 * (ph % 1) - 1) + 0.4 * noise(0.14)
            s = bp(s, 400, 2200) * np.sin(np.linspace(0, np.pi, len(s))) ** 0.5
            place(x, s * 0.5, k * 0.22)
        return x
    if name == "pop":
        t = t_(0.3)
        return hp(noise(0.3), 800) * np.exp(-t * 60) * 0.9 + kick(0.3, 0.3)
    if name == "drip":
        x = np.zeros(int(3.0 * SR))
        for k in range(3):
            t = t_(0.3)
            f = 900 + 600 * np.exp(-t * 40)
            place(x, np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 30) * 0.25, k * 0.9)
        return x
    if name in ("chain_rattle", "metal_creak"):
        d = 1.6
        x = np.zeros(int(d * SR))
        for k in range(14):
            place(x, bp(noise(0.06), 2000, 7000) * 0.25, rng.uniform(0, d - 0.1))
        if name == "metal_creak":
            t = t_(d)
            f = 180 + 60 * np.sin(t * 3)
            x += bp(np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)), 300, 2500) * 0.05 * np.sin(
                np.linspace(0, np.pi, len(t)))
        return x
    if name == "strike":
        x = np.zeros(int(2.0 * SR))
        place(x, kick(0.6, 0.5), 0)
        for k in range(16):
            t = t_(0.25)
            f = rng.uniform(600, 1600)
            place(x, (np.sin(2 * np.pi * f * t) * 0.3 + noise(0.25) * 0.2) * np.exp(-t * 18), rng.uniform(0, 0.5))
        return x * 0.8
    if name == "balls_thunder":
        d = 4.0
        x = lp(noise(d), 300) * 0.8
        for k in range(40):
            place(x, kick(0.25, 0.3), rng.uniform(0, d - 0.3))
        return x * np.minimum(1, np.linspace(0, 6, len(x))) * np.linspace(1, 0.3, len(x))
    if name in ("rain_loop", "storm_loop"):
        d = 30.0
        x = hp(noise(d), 1500) * 0.06 + lp(noise(d), 600) * (0.05 if name == "rain_loop" else 0.12)
        return x
    if name == "thunder":
        d = 4.0
        t = t_(d)
        return lp(noise(d), 200) * (np.exp(-t * 1.2) * 1.2) + lp(noise(d), 900) * np.exp(-t * 6) * 0.4
    if name == "power_down":
        d = 2.0
        t = t_(d)
        f = 120 * np.exp(-t * 1.5) + 20
        return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 1.2) * 0.4 + kick(0.6, d)
    if name == "pull_cord":
        t = t_(0.6)
        return bp(noise(0.6), 300, 2000) * np.exp(-t * 6) * 0.3
    if name == "generator":
        d = 8.0
        t = t_(d)
        f = 32
        x = (saw(f, d) + 0.5 * saw(f * 2.01, d) + 0.2 * lp(noise(d), 300)) * (0.5 + 0.5 * np.sin(2 * np.pi * 8 * t) ** 2)
        x = lp(x, 500) * 0.25
        x *= np.minimum(1, t / 0.3) * np.where(t > d - 1.5, (d - t) / 1.5, 1)
        return x
    if name == "helicopter":
        d = 22.0
        t = t_(d)
        chop = (0.5 + 0.5 * np.sin(2 * np.pi * 7 * t)) ** 3
        x = lp(noise(d), 260) * chop * 0.9 + lp(saw(28, d), 300) * 0.1
        x *= np.minimum(1, t / 2.5)
        return x
    if name == "scream":
        d = 1.4
        t = t_(d)
        f = 420 + 160 * np.sin(np.clip(t / 0.25, 0, 1) * np.pi / 2) + 18 * np.sin(2 * np.pi * 7 * t)
        ph = np.cumsum(f) / SR
        src = 2 * (ph % 1) - 1
        x = bp(src, 700, 1300) + 0.6 * bp(src, 1800, 2800) + 0.3 * noise(d) * 0.2
        x *= np.minimum(1, t / 0.05) * np.exp(-np.maximum(0, t - 0.9) * 6)
        return x * 0.35
    if name == "cart_roll":
        d = 3.0
        t = t_(d)
        return bp(noise(d), 200, 1200) * 0.12 * (0.7 + 0.3 * np.sin(2 * np.pi * 14 * t))
    if name == "sizzle":
        d = 6.0
        return hp(noise(d), 3000) * 0.05 * (0.8 + 0.2 * np.sin(2 * np.pi * 0.7 * t_(d)))
    if name == "music_phones":
        d = 8.0
        x = music("fun", d, 99, 1.0)
        return bp(x, 500, 4000) * 1.4 * np.minimum(1, t_(d) / 0.3)
    if name == "city_ambience":
        d = 10.0
        t = t_(d)
        f = 700 + 250 * np.sin(2 * np.pi * 0.5 * t)
        siren = np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.03
        return siren + lp(noise(d), 400) * 0.08
    if name == "groans":
        return groans(10.0, 6)
    return np.zeros(int(0.1 * SR))


def groan(d=1.6, f0=None):
    f0 = f0 or rng.uniform(85, 140)
    t = t_(d)
    f = f0 * (1 + 0.12 * np.sin(2 * np.pi * rng.uniform(0.6, 1.4) * t) - 0.1 * t / d)
    ph = np.cumsum(f) / SR
    src = 2 * (ph % 1) - 1 + 0.3 * noise(d) * 0.3
    x = bp(src, 250, 700) + 0.5 * bp(src, 900, 1300)
    return x * np.sin(np.linspace(0, np.pi, len(x))) ** 1.5 * 0.25


def groans(d, n):
    x = np.zeros(int(d * SR))
    for k in range(n):
        place(x, groan(rng.uniform(1.0, 2.2)), rng.uniform(0, d - 2.2), rng.uniform(0.4, 1.0))
    return lp(x, 1800)


# сегмент → эмбиент: [(с, до, имя, громкость)]
AMB = {
    "cold": [(0, 7, "groans", 0.5)], "d01": [(0, 6, "city_ambience", 0.8), (0, 30, "groans", 0.7)],
    "d04": [(5, 16, "groans", 0.6)], "d10": [(24, 30, "groans", 0.7)], "d11": [(0, 30, "rain_loop", 0.8),
                                                                              (21, 30, "groans", 0.6)],
    "d13": [(26, 30, "groans", 0.4)], "d17": [(14, 19, "rain_loop", 0.7)], "d21": [(15, 22, "groans", 0.6)],
    "d24": [(21, 30, "storm_loop", 0.3)], "d25": [(0, 30, "storm_loop", 1.0), (16, 30, "groans", 0.7)],
    "d26": [(0, 30, "storm_loop", 0.5), (8, 30, "groans", 0.8)], "d28": [(6, 30, "groans", 1.0)],
    "d29": [(0, 30, "groans", 0.9)], "d30": [(0, 30, "groans", 0.6)], "epi": [(0, 4, "helicopter", 0.5)],
}


def fit(x, d):
    n = int(d * SR)
    if len(x) >= n:
        y = x[:n].copy()
    else:
        reps = int(np.ceil(n / max(1, len(x))))
        y = np.tile(x, reps)[:n]
    f = min(int(0.4 * SR), n // 4)
    if f > 0:
        y[:f] *= np.linspace(0, 1, f)
        y[-f:] *= np.linspace(1, 0, f)
    return y


# --- сведение ----------------------------------------------------------------------

def load_voice(path, tempo):
    if abs(tempo - 1.0) > 1e-3:
        raw = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-filter:a", f"atempo={tempo}", "-ar", str(SR),
                              "-ac", "1", "-f", "f32le", "-"], capture_output=True).stdout
    else:
        raw = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-ar", str(SR), "-ac", "1", "-f", "f32le", "-"],
                             capture_output=True).stdout
    return np.frombuffer(raw, np.float32).astype(np.float64)


def build(film_segments=None):
    from scenes import timing as TM
    from scenes import timeline
    os.makedirs(OUT, exist_ok=True)
    film = timeline.build()
    total = film.dur
    n = int(total * SR) + SR
    voice = np.zeros(n)
    mus = np.zeros(n)
    fxb = np.zeros(n)
    tim = json.load(open(os.path.join(ROOT, "build", "voice", "timing.json")))["segments"]
    for i, S in enumerate(film.segments):
        t0 = S.start
        # озвучка
        if S.key in tim:
            tempo = tim[S.key]["tempo"]
            for L in tim[S.key]["lines"]:
                v = load_voice(L["file"], tempo)
                place(voice, v, t0 + L["start"])
        # музыка
        m = segment_music(S.key, S.dur + 1.0, i)
        e = np.ones(len(m))
        f = int(0.5 * SR)
        e[:f] = np.linspace(0.3, 1, f)
        e[-int(1.0 * SR):] = np.linspace(1, 0, int(1.0 * SR))
        place(mus, m * e, t0)
        # смена дня — свист
        if i > 0 and S.key.startswith("d"):
            place(fxb, sfx("whoosh"), t0 - 0.15, 0.8)
        # эмбиент
        for a, b, name, g in AMB.get(S.key, []):
            place(fxb, fit(sfx(name), b - a), t0 + a, g)
        # события сцен
        for t, name, g in S.sfx:
            if name in ("rain_loop", "storm_loop"):
                continue
            place(fxb, sfx(name), t0 + t, g)
        print("audio", S.key, flush=True)
    # ducking: музыка тише под голосом
    env = movavg(np.abs(voice), 0.05 * SR)
    env = np.minimum(1, env / 0.02)
    env = movavg(env, 0.25 * SR)
    duck = 1 - 0.55 * env
    mus = reverb(mus, 2.4, 0.3) * duck
    fxb = reverb(fxb, 1.2, 0.15)
    # голос: лёгкая компрессия/выравнивание
    vpk = np.percentile(np.abs(voice[np.abs(voice) > 1e-4]), 99.5) if np.any(np.abs(voice) > 1e-4) else 1
    voice = voice / vpk * 0.5
    voice = hp(voice, 70)
    mix_l = voice * 1.0 + mus * 0.55 + fxb * 0.6
    mix_r = voice * 1.0 + np.roll(mus, int(0.012 * SR)) * 0.55 + np.roll(fxb, int(0.008 * SR)) * 0.6
    st = np.stack([mix_l, mix_r], 1)[:int(total * SR)]
    st /= max(1.0, np.abs(st).max() / 0.95)
    p = os.path.join(OUT, "mix.wav")
    sf.write(p, st.astype(np.float32), SR)
    print(p, "%.1f s" % (len(st) / SR))


if __name__ == "__main__":
    build()
