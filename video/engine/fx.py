"""Пост-обработка кадра: свечение, глитч, хроматическая аберрация, зерно, виньетка, строки."""
import numpy as np
from PIL import Image, ImageFilter

from .core import H, W, hash01


class Post:
    def __init__(self, seed=7):
        rng = np.random.default_rng(seed)
        yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
        d = np.sqrt(((xx - W / 2) / (W * 0.62)) ** 2 + ((yy - H / 2) / (H * 0.62)) ** 2)
        vig = np.clip(1.0 - 0.55 * np.clip(d - 0.35, 0, None) ** 1.6, 0.25, 1.0)
        scan = 1.0 - 0.06 * ((np.arange(H) % 3) == 0).astype(np.float32)
        self.mul = (vig * scan[:, None] * 256).astype(np.int32)[..., None]  # ×256
        self.grain = [rng.normal(0, 4.0, (H, W)).astype(np.int16)[..., None] for _ in range(6)]
        self.rng = rng

    def bloom(self, rgb, strength=0.55):
        im = Image.frombuffer("RGB", (W, H), rgb, "raw", "RGB", 0, 1)
        sm = im.reduce(4)
        # порог: светятся только яркие детали, большие светлые плоскости не «выгорают»
        sm = Image.fromarray(np.clip(np.asarray(sm, dtype=np.int16) - 70, 0, 255).astype(np.uint8))
        b1 = sm.filter(ImageFilter.GaussianBlur(3))
        b2 = sm.reduce(2).filter(ImageFilter.GaussianBlur(7)).resize(sm.size, Image.BILINEAR)
        a1 = np.asarray(b1, dtype=np.uint16)
        a2 = np.asarray(b2, dtype=np.uint16)
        mixed = np.minimum(a1 * 0.6 + a2 * 0.9, 255).astype(np.uint8)
        up = Image.fromarray(mixed).resize((W, H), Image.BILINEAR)
        return (np.asarray(up, dtype=np.int32) * int(strength * 256)) >> 8

    def glitch(self, rgb, amt, t):
        """amt 0..1: сдвиг полос, разнесение каналов, блоки шума."""
        out = rgb.copy()
        seed = int(t * 30)
        nb = int(4 + amt * 14)
        for i in range(nb):
            y0 = int(hash01(seed, i, 1) * H)
            h = int(4 + hash01(seed, i, 2) * 70 * amt)
            dx = int((hash01(seed, i, 3) - 0.5) * 2 * 160 * amt)
            out[y0:y0 + h] = np.roll(rgb[y0:y0 + h], dx, axis=1)
        sh = int(4 + 22 * amt)
        res = out.copy()
        res[:, sh:, 0] = out[:, :-sh, 0]
        res[:, :-sh, 2] = out[:, sh:, 2]
        # пара белых/красных полос
        for i in range(int(amt * 4)):
            y0 = int(hash01(seed, i, 9) * H)
            res[y0:y0 + 2, :, :] = np.clip(res[y0:y0 + 2, :, :].astype(np.int16) + 90, 0, 255)
        return res

    def apply(self, rgba, t, frame, glitch=0.0, flash=0.0, bloom=0.6, dark=0.0):
        rgb = np.ascontiguousarray(rgba[..., :3])
        if glitch > 0.02:
            rgb = self.glitch(rgb, min(1.0, glitch), t)
        acc = rgb.astype(np.int32)
        if bloom > 0:
            acc += self.bloom(rgb, bloom)
        # лёгкая постоянная аберрация (1 пикс.)
        acc[:, 1:, 0] = acc[:, :-1, 0]
        acc *= self.mul
        acc >>= 8
        flick = 1.0 + 0.015 * (hash01(frame, 5) - 0.5)
        if dark > 0:
            flick *= (1 - dark)
        if flick != 1.0:
            acc = (acc * int(flick * 256)) >> 8
        acc += self.grain[frame % len(self.grain)]
        if flash > 0:
            acc += int(flash * 255)
        np.clip(acc, 0, 255, out=acc)
        return acc.astype(np.uint8)
