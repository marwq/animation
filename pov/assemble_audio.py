"""Сборка звука для куска ролика [a, b]: первые три минуты (audio.py → pov/out/audio.wav, с запасом до 186 с)
и окна глубин (audio_deep.py → pov/out/deep_audio/seg_*.wav, каждое с запасом ±XF). Стыки — равномощные
перекрёстки: на 3:00 — две секунды, между окнами — 2·XF.

    python3 pov/assemble_audio.py 180 240   -> pov/out/min/audio_180_240.wav
"""
import json
import re
import sys
import wave
from pathlib import Path

import numpy as np

HERE = Path(__file__).resolve().parent
SR = 48000
XF = 0.25
HANDOFF = 180.0
JOIN = 2.0  # с: перекрёсток первых трёх минут и глубин
DEEP_TRIM = 10 ** (1.0 / 20)  # глубины на 1 дБ тише конца третьей минуты — выравниваем
DUR = float(json.loads((HERE / 'scene.json').read_text())['duration'])


def load(path):
    with wave.open(str(path)) as w:
        x = np.frombuffer(w.readframes(w.getnframes()), '<i2').reshape(-1, 2).T / 32767.0
    return x


def segments():
    out = []
    for p in sorted((HERE / 'out' / 'deep_audio').glob('seg_*_*.wav')):
        m = re.match(r'seg_(\d+)_(\d+)\.wav', p.name)
        out.append((int(m[1]), int(m[2]), p))
    return sorted(out)


def build(a, b):
    n = int(round((b - a) * SR))
    tt = a + np.arange(n) / SR
    mix = np.zeros((2, n))
    weight = np.zeros(n)
    if a < HANDOFF + JOIN:
        A = load(HERE / 'out' / 'audio.wav')
        i0 = int(round(a * SR))
        piece = A[:, i0:i0 + n]
        k = np.clip((tt[:piece.shape[1]] - HANDOFF) / JOIN, 0, 1)
        g = np.cos(k * np.pi / 2)
        mix[:, :piece.shape[1]] += piece * g
        weight[:piece.shape[1]] += g ** 2
    segs = [s for s in segments() if s[1] + XF > a and s[0] - XF < b]
    for s0, s1, path in segs:
        x = load(path) * DEEP_TRIM
        start = s0 - XF  # файл начинается за XF до своего окна
        i0 = int(round((start - a) * SR))
        lo, hi = max(0, i0), min(n, i0 + x.shape[1])
        if hi <= lo:
            continue
        t = tt[lo:hi]
        # вход: на 3:00 — перекрёсток с первыми минутами, на остальных стыках — с соседним окном
        if s0 == int(HANDOFF):
            kin = np.clip((t - HANDOFF) / JOIN, 0, 1)
        else:
            kin = np.clip((t - (s0 - XF)) / (2 * XF), 0, 1)
        kout = 1 - np.clip((t - (s1 - XF)) / (2 * XF), 0, 1)
        g = np.sin(kin * np.pi / 2) * np.cos((1 - kout) * np.pi / 2)
        mix[:, lo:hi] += x[:, lo - i0:hi - i0] * g
        weight[lo:hi] += g ** 2
    # конец ролика: звук уходит вместе с титром
    mix *= 1 - np.clip((tt - (DUR - 2.5)) / 2.5, 0, 1) ** 2
    gaps = np.mean(weight < 0.5)
    if gaps > 0:
        print(f'warning: {gaps * 100:.1f}% of [{a}, {b}] has no audio source')
    return mix


def write(path, x):
    x = np.clip(x, -1, 1)
    path.parent.mkdir(parents=True, exist_ok=True)
    with wave.open(str(path), 'wb') as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((x.T * 32767).astype('<i2').tobytes())


if __name__ == '__main__':
    a, b = float(sys.argv[1]), float(sys.argv[2])
    out = Path(sys.argv[3]) if len(sys.argv) > 3 else HERE / 'out' / 'min' / f'audio_{int(a)}_{int(b)}.wav'
    mix = build(a, b)
    write(out, mix)
    print(out.relative_to(HERE.parent), 'peak', round(float(np.max(np.abs(mix))), 3))
