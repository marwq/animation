#!/usr/bin/env python3
"""Хромакей: видео на зелёном фоне -> MOV (QuickTime Animation) с прозрачным фоном.

  python3 tools/chromakey.py in.mp4 assets/intro/countdown-321.mov [--key 21EC0C]

Прозрачность — по «зелёности» пикселя (g − max(r, b)); на полупрозрачных краях цвет фона
вычитается обратно (без зелёной каймы и без розового оттенка у белого, как бывает у despill).
Нужен ffmpeg.
"""
import glob
import os
import subprocess
import sys
import tempfile

import numpy as np
from PIL import Image


def key_frame(c, K, lo=35, hi=175):
    gm = c[..., 1] - np.maximum(c[..., 0], c[..., 2])
    a = 1 - np.clip((gm - lo) / (hi - lo), 0, 1)
    fg = np.clip((c - (1 - a)[..., None] * K) / np.maximum(a, 1e-3)[..., None], 0, 255)
    fg[..., 1] = np.minimum(fg[..., 1], np.maximum(fg[..., 0], fg[..., 2]) + 12)   # остаток зелени на краях
    out = np.dstack([fg, a * 255]).astype(np.uint8)
    out[a < 0.02] = 0
    return out


def main():
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    src, dst = args[0], args[1]
    k = sys.argv[sys.argv.index('--key') + 1] if '--key' in sys.argv else '21EC0C'
    K = np.array([int(k[i:i + 2], 16) for i in (0, 2, 4)], float)
    fps = subprocess.run(['ffprobe', '-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=r_frame_rate',
                          '-of', 'default=nw=1:nk=1', src], capture_output=True, text=True, check=True).stdout.strip()
    with tempfile.TemporaryDirectory() as tmp:
        subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-i', src, os.path.join(tmp, 'f%04d.png')], check=True)
        for f in sorted(glob.glob(os.path.join(tmp, 'f*.png'))):
            Image.fromarray(key_frame(np.array(Image.open(f).convert('RGB')).astype(float), K), 'RGBA').save(f)
        subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-framerate', fps, '-i', os.path.join(tmp, 'f%04d.png'),
                        '-c:v', 'qtrle', '-pix_fmt', 'argb', dst], check=True)
    print(dst)


if __name__ == '__main__':
    main()
