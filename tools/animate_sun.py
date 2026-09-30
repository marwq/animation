"""Солнце светится: лучи поблескивают и чуть увеличиваются / уменьшаются.
1 секунда, бесшовный цикл.

Центральный круг (чёрный диск и жёлтое кольцо вокруг него) не меняется ни на пиксель:
всё, что ближе PROTECT к центру, копируется из оригинала.
"""
import subprocess
import sys
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "animations" / "sun"
FPS = 30
SECONDS = 1.0

src = np.asarray(Image.open(OUT / "sun.png").convert("RGB")).astype(np.float32)
H, W, _ = src.shape

# Центр и радиус диска — самая большая чёрная область, не касающаяся краёв.
dark = src[..., 0] < 128
lab, n = ndimage.label(dark)
sizes = ndimage.sum(np.ones_like(lab), lab, range(1, n + 1))
disc = lab == (np.argsort(sizes)[-2] + 1)
ys, xs = np.nonzero(disc)
cx, cy = xs.mean(), ys.mean()
r_disc = np.sqrt(len(xs) / np.pi)

PROTECT = r_disc + 16      # кольцо целиком внутри — здесь всё как в оригинале

yy, xx = np.mgrid[:H, :W].astype(np.float32)
rho = np.hypot(xx - cx, yy - cy)
theta = np.arctan2(yy - cy, xx - cx)
inside = rho < PROTECT
outside = np.clip((rho - PROTECT) / 6, 0, 1)[..., None]  # мягкий шов у кольца

YELLOW = src[int(cy), int(cx + r_disc + 5)]              # цвет лучей
GLINT = np.array([255, 250, 215], np.float32)            # цвет блика


def sample(img, sy, sx):
    return np.stack([ndimage.map_coordinates(img[..., c], [sy, sx], order=1,
                                             mode="constant", cval=0)
                     for c in range(img.shape[2])], axis=-1)


def frame(t):
    p = 2 * np.pi * t  # фаза цикла, t ∈ [0, 1)
    # Лучи чуть вытягиваются и втягиваются, соседние — с небольшим сдвигом по фазе.
    scale = 1 + 0.055 * np.sin(p) + 0.02 * np.sin(p + 3 * theta)
    r = PROTECT + (rho - PROTECT) / scale
    sx = cx + r * np.cos(theta)
    sy = cy + r * np.sin(theta)
    out = np.where(inside[..., None], src, sample(src, sy, sx))

    ray = out[..., :1] / 255  # маска лучей (жёлтое = 1)

    # Блеск: светлые переливы пробегают по лучам по кругу.
    glint = (0.5 + 0.5 * np.sin(4 * theta - p)) ** 6
    glint *= 0.55 * np.clip((rho - PROTECT) / 60, 0, 1) * (0.75 + 0.25 * np.sin(p))
    out = out + ray * glint[..., None] * (GLINT - out)

    # Сияние вокруг лучей — дышит в такт.
    halo = ndimage.gaussian_filter(ray[..., 0], 14)[..., None]
    halo_a = (0.55 + 0.25 * np.sin(p)) * halo * (1 - ray) * outside
    out = out + halo_a * (YELLOW - out)

    out[inside] = src[inside]  # круг — точная копия оригинала
    return np.clip(out + 0.5, 0, 255).astype(np.uint8)


frames_dir = OUT / "frames"
frames_dir.mkdir(exist_ok=True)
count = int(FPS * SECONDS)
frames = []
for i in range(count):
    img = Image.fromarray(frame(i / count))
    img.save(frames_dir / f"{i:03d}.png")
    frames.append(img)

frames[0].save(OUT / "sun.gif", save_all=True, append_images=frames[1:],
               duration=int(1000 / FPS), loop=0, optimize=True)

pattern = str(frames_dir / "%03d.png")
subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-framerate", str(FPS),
                "-i", pattern, "-vf", "pad=ceil(iw/2)*2:ceil(ih/2)*2",
                "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "16",
                "-movflags", "+faststart", str(OUT / "sun.mp4")], check=True)
print(f"{count} кадров, центр ({cx:.1f}, {cy:.1f}), r={r_disc:.1f}", file=sys.stderr)
