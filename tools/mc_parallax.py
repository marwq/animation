#!/usr/bin/env python3
"""Тестовое видео из слоёв фона: камера чуть едет вбок и наезжает (параллакс).

    python3 tools/mc_parallax.py backgrounds/field/portal [опции]

    --char PNG       персонаж на прозрачном фоне (по умолчанию Элли спереди)
    --char-h N       рост персонажа в блоках (1.7)
    --char-x PX      сдвиг персонажа вбок от центра кадра, в пикселях кадра
    --move X,Z       сдвиг камеры за ролик, в блоках: вбок и вперёд (0.6,0.5)
    --sec N          длина ролика (5), 24 кадра в секунду
    --no-glow        без свечения портала

Персонаж стоит на траве на глубине слоя ground и двигается вместе с ним.
Слой ведёт себя как картинка на своей глубине z: при сдвиге камеры на X блоков
вбок и Z вперёд он увеличивается в z/(z−Z) раз и уезжает на f·X/(z−Z) пикселей.
Результат: <папка>/parallax.mp4, кадр 1080×1080.
"""
import json
import os
import subprocess
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FPS = 24


def args(a):
    opt = {'dir': a[0], 'char': os.path.join(ROOT, 'characters', 'ellie', 'png', 'front.png'),
           'char_h': 1.7, 'char_x': 0.0, 'move': '0.6,0.5', 'sec': 5.0, 'no_glow': False}
    i = 1
    while i < len(a):
        k = a[i].lstrip('-').replace('-', '_')
        if k == 'no_glow':
            opt[k] = True
        else:
            i += 1
            opt[k] = a[i] if isinstance(opt[k], str) else type(opt[k])(a[i])
        i += 1
    return opt


def premul(img):
    """RGBA → массив с умноженной альфой: так края при масштабе не темнеют."""
    return img.convert('RGBa')


def character(opt, meta, size, pad):
    """Персонаж с мягкой тенью на холсте размером со слой."""
    canvas = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    if not opt['char']:
        return canvas
    ch = Image.open(opt['char']).convert('RGBA')
    ch = ch.crop(ch.getbbox())
    h = round(meta['block_px_at_feet'] * opt['char_h'])
    ch = ch.resize((round(ch.width * h / ch.height), h), Image.LANCZOS)
    fx, fy = meta['feet'][0] + pad + opt['char_x'], meta['feet'][1] + pad
    sh = Image.new('L', (size, size), 0)
    w = ch.width * 0.75
    ImageDraw.Draw(sh).ellipse((fx - w / 2, fy - w * 0.1, fx + w / 2, fy + w * 0.1), fill=110)
    sh = sh.filter(ImageFilter.GaussianBlur(w * 0.06))
    canvas.paste((20, 30, 10, 255), (0, 0), sh)
    canvas.alpha_composite(ch, (round(fx - ch.width / 2), round(fy - ch.height * 0.985)))
    return canvas


def transform(img, s, shift, size, frame):
    c_in, c_out = size / 2, frame / 2
    data = (1 / s, 0, c_in + (shift - c_out) / s, 0, 1 / s, c_in - c_out / s)
    return img.transform((frame, frame), Image.AFFINE, data, Image.BICUBIC)


def main(opt):
    d = os.path.abspath(opt['dir'])
    L = os.path.join(d, 'layers')
    meta = json.load(open(os.path.join(L, 'scene.json')))
    size, frame, f = meta['layer_size'][0], meta['frame'][0], meta['focal_px']
    pad = (size - frame) // 2
    mx, mz = (float(v) for v in opt['move'].split(','))

    stack = []                                  # (имя, картинка, глубина)
    for name in meta['order']:
        z = meta['depth'].get(name, 1e9)
        stack.append((name, premul(Image.open(os.path.join(L, name + '.png'))), z))
        if name == 'ground':
            stack.append(('char', premul(character(opt, meta, size, pad)), z))
    glow = None
    if not opt['no_glow'] and os.path.exists(os.path.join(L, 'portal_glow.png')):
        glow = Image.open(os.path.join(L, 'portal_glow.png')).convert('RGB')

    out = os.path.join(d, 'parallax.mp4')
    ff = subprocess.Popen(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'rawvideo',
                           '-pix_fmt', 'rgb24', '-s', f'{frame}x{frame}', '-r', str(FPS),
                           '-i', '-', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '17',
                           '-movflags', '+faststart', out], stdin=subprocess.PIPE)
    n = round(opt['sec'] * FPS)
    for i in range(n):
        t = i / (n - 1)
        e = t * t * (3 - 2 * t)                 # плавный старт и остановка
        tx, tz = mx * (e - 0.5), mz * e
        acc = None
        for name, img, z in stack:
            s = z / (z - tz)
            sh = f * tx / (z - tz)
            a = np.asarray(transform(img, s, sh, size, frame), np.float32) / 255
            acc = a if acc is None else a + acc * (1 - a[..., 3:])
            if name == 'portal' and glow:
                g = np.asarray(transform(glow, s, sh, size, frame), np.float32) / 255
                acc[..., :3] = np.clip(acc[..., :3] + g, 0, 1)
        ff.stdin.write((np.clip(acc[..., :3], 0, 1) * 255 + 0.5).astype(np.uint8).tobytes())
    ff.stdin.close()
    ff.wait()
    print(out)


if __name__ == '__main__':
    main(args(sys.argv[1:]))
