#!/usr/bin/env python3
"""Звук для мультика: звуки Minecraft, свои эффекты и тихая музыка на нотных блоках.

    python3 tools/add_sound.py ВИДЕО.mp4 [--out videos/ИМЯ_sound.mp4]

Звуки Minecraft скачиваются с официального сервера Mojang в sound/minecraft/
(папка в .gitignore — это файлы Mojang). Свисты, «вуш» и «бум» синтезируются здесь
же, музыка — мелодия из звуков нотных блоков (арфа, бас, колокольчик) с эхом,
своя, поэтому без претензий за чужую музыку на YouTube.

Делает два файла: в той же ориентации, что исходник, и вертикальный 1080×1920
(исходник лежит на боку: небо слева). Расстановка звуков — список CUES ниже,
время в секундах, громкость в дБ.
"""
import json
import os
import subprocess
import sys
import urllib.request

import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SND = os.path.join(ROOT, 'sound', 'minecraft')
RATE = 48000
VERSION = '1.21.4'

# (время, звук, дБ, скорость/высота, панорама -1…1). Сверху дедушка, снизу смайлик.
CUES = [
    # медитация и радуга с печенькой
    (0.00, 'block/beacon/activate', -9, 1.0, 0),
    (0.05, 'block/amethyst/shimmer', -12, 1.0, 0.3),
    (0.22, 'random/pop', -10, 1.3, 0.4),
    (0.45, 'random/pop', -10, 1.5, 0.5),
    (0.64, 'mob/slime/small1', -9, 1.4, 0.4),
    (0.95, 'random/pop', -11, 1.2, 0.3),
    (1.15, 'whoosh', -16, 1.0, 0),
    (1.30, 'random/orb', -9, 1.1, 0),            # смайлик появился
    (1.78, 'boom', -1, 1.0, 0),                  # крупный план обоих
    (1.95, 'whoosh', -18, 1.3, 0),
    # дедушка идёт и сердится
    (2.40, 'step/grass1', -20, 1.0, -0.2),
    (2.72, 'step/grass2', -18, 1.0, 0.2),
    (3.04, 'step/grass3', -15, 1.0, -0.2),
    (3.34, 'step/grass4', -12, 1.0, 0.2),
    (3.42, 'entity/player/attack/knockback1', -6, 1.0, 0),
    (3.58, 'mob/slime/big1', -3, 1.0, 0),        # смайлик сплющился
    (3.75, 'mob/villager/no2', -4, 0.9, 0),      # «хмм!»
    (4.55, 'whoosh', -15, 0.8, 0),
    (4.62, 'step/grass5', -12, 1.3, 0),
    (4.78, 'step/grass6', -12, 1.3, 0),
    (4.94, 'step/grass2', -12, 1.3, 0),
    # портал, толкает внутрь
    (5.00, 'portal/portal', -11, 1.0, 0, 3.4),   # гул портала (длина, с)
    (5.25, 'block/amethyst/resonate1', -12, 1.0, 0.3),
    (6.15, 'mob/villager/haggle1', -6, 0.85, 0),
    (6.70, 'mob/villager/no3', -6, 0.85, 0),
    (7.00, 'entity/player/attack/sweep1', -4, 1.0, 0),
    (7.15, 'entity/player/attack/strong1', -4, 1.0, 0),
    (7.22, 'mob/slime/small3', -6, 1.1, 0),
    (7.42, 'portal/trigger', -3, 1.0, 0, 1.0),   # засасывает в портал
    (7.70, 'step/grass1', -20, 1.0, -0.3),
    (8.00, 'step/grass3', -21, 1.0, -0.3),
    # Незер
    (8.35, 'portal/travel', -6, 1.0, 0, 1.6),
    (8.40, 'ambient/nether/nether_wastes/ambience', -6, 1.0, 0, 1.55),
    (8.40, 'liquid/lava', -12, 1.0, 0.3, 1.55),
    (8.55, 'whistle', -9, 1.0, 0),               # смайлик падает
    (8.75, 'liquid/lavapop', -10, 1.0, 0.5),
    (9.15, 'liquid/lavapop', -10, 0.9, -0.4),
    (9.58, 'damage/fallbig', 0, 1.0, 0),
    (9.60, 'mob/slime/big2', -2, 0.8, 0),        # шлёп
    (9.72, 'liquid/lavapop', -11, 1.1, 0.3),
    # снова медитация, смайлик вернулся
    (9.95, 'block/amethyst/shimmer', -11, 1.0, -0.3),
    (10.18, 'random/pop', -11, 1.4, 0.4),
    (10.40, 'mob/slime/small2', -10, 1.4, 0.4),
    (10.62, 'random/pop', -11, 1.2, 0.3),
    (10.80, 'mob/endermen/portal', -4, 1.0, 0),  # телепорт: он вернулся
    (11.95, 'ambient/cave/cave12', -4, 1.0, 0),  # жуткая тишина
    # скример и хруст
    (12.36, 'boom', -2, 0.8, 0),
    (12.38, 'mob/ghast/scream1', -2, 1.0, 0),
    (12.45, 'mob/villager/hit1', -5, 1.2, 0),
    (12.58, 'random/eat1', 0, 1.0, 0),
    (12.72, 'random/eat3', 0, 0.9, 0),
    (12.88, 'random/burp', 0, 1.0, 0),
]
MUSIC_DB = -28                                   # средняя громкость музыки: тихо, фоном
MUSIC_END = 11.95                                # перед жутью музыка стихает
DUCK = [(1.7, 2.2, 0.5), (8.35, 9.95, 0.35)]     # где музыку прибрать: начало, конец, доля


# ------------------------------------------------------------------ звуки Minecraft
def fetch():
    """Скачать нужные звуки с серверов Mojang (как это делает лаунчер)."""
    need = {c[1] for c in CUES if '/' in c[1]} | {'note/harp', 'note/bass', 'note/bell'}
    if all(os.path.exists(os.path.join(SND, n + '.ogg')) for n in need):
        return
    get = lambda u: json.load(urllib.request.urlopen(u, timeout=60))
    man = get('https://piston-meta.mojang.com/mc/game/version_manifest_v2.json')
    ver = get(next(v['url'] for v in man['versions'] if v['id'] == VERSION))
    idx = get(ver['assetIndex']['url'])['objects']
    for n in sorted(need):
        out = os.path.join(SND, n + '.ogg')
        if not os.path.exists(out):
            h = idx[f'minecraft/sounds/{n}.ogg']['hash']
            os.makedirs(os.path.dirname(out), exist_ok=True)
            urllib.request.urlretrieve(f'https://resources.download.minecraft.net/{h[:2]}/{h}', out)


def load(name):
    """ogg → float32 стерео RATE Гц."""
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', os.path.join(SND, name + '.ogg'),
                          '-f', 'f32le', '-ac', '2', '-ar', str(RATE), '-'],
                         capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).reshape(-1, 2).copy()


def speed(a, k):
    """Быстрее и выше (k > 1) или медленнее и ниже — как высота звука в игре."""
    if k == 1:
        return a
    n = int(len(a) / k)
    t = np.arange(n) * k
    return np.stack([np.interp(t, np.arange(len(a)), a[:, c]) for c in range(2)], -1)


# ------------------------------------------------------------------ свои эффекты
def env(n, attack, release):
    e = np.ones(n)
    a, r = int(attack * RATE), int(release * RATE)
    e[:a] = np.linspace(0, 1, a)
    e[n - r:] *= np.linspace(1, 0, r)
    return e


def lowpass(x, cutoff):
    """Однополюсный фильтр с меняющейся частотой среза (массив, Гц)."""
    k = 1 - np.exp(-2 * np.pi * cutoff / RATE)
    y = np.empty_like(x)
    acc = 0.0
    for i in range(len(x)):
        acc += k[i] * (x[i] - acc)
        y[i] = acc
    return y


def synth(name, k=1.0):
    rng = np.random.default_rng(len(name))
    if name == 'whoosh':                         # шум, фильтр открывается и закрывается
        n = int(0.45 / k * RATE)
        t = np.linspace(0, 1, n)
        cut = 200 + 2200 * np.sin(np.pi * t) ** 2
        x = lowpass(rng.standard_normal(n), cut) * np.sin(np.pi * t) ** 2 * 1.2
        return np.stack([x * (1 - 0.4 * t), x * (0.6 + 0.4 * t)], -1)
    if name == 'boom':                           # мемный «бум»: низкий удар с хвостом
        n = int(1.6 * RATE)
        t = np.arange(n) / RATE
        f = 40 + 60 * np.exp(-t * 9)
        x = np.sin(2 * np.pi * np.cumsum(f * k) / RATE) * np.exp(-t * 2.6)
        x += 0.5 * np.sin(4 * np.pi * np.cumsum(f * k) / RATE) * np.exp(-t * 5)
        x += rng.standard_normal(n) * np.exp(-t * 60) * 0.3
        x = np.tanh(x * 2.2) * 0.8
        return np.stack([x, x], -1)
    if name == 'whistle':                        # свист падения, вниз по высоте
        n = int(1.0 * RATE)
        t = np.arange(n) / RATE
        f = 1900 * np.exp(-t * 1.5) + 250 + 18 * np.sin(2 * np.pi * 6 * t)
        x = np.sin(2 * np.pi * np.cumsum(f) / RATE) * env(n, 0.04, 0.12) * 0.5
        return np.stack([x, x], -1)
    raise KeyError(name)


# ------------------------------------------------------------------ музыка
def reverb(x, seconds=2.4, wet=0.45):
    n = int(seconds * RATE)
    rng = np.random.default_rng(7)
    ir = rng.standard_normal((n, 2)) * np.exp(-np.arange(n) / RATE / 0.8)[:, None]
    ir /= np.sqrt((ir ** 2).sum(0))
    m = len(x) + n
    size = 1 << (m - 1).bit_length()
    y = np.fft.irfft(np.fft.rfft(x, size, axis=0) * np.fft.rfft(ir, size, axis=0), size, axis=0)[:m]
    out = np.zeros((m, 2))
    out[:len(x)] = x * (1 - wet)
    return out + y * wet


def music(length):
    """Спокойная мелодия на нотных блоках: арпеджио арфы, бас, колокольчик сверху."""
    harp, bass, bell = load('note/harp'), load('note/bass'), load('note/bell')
    note = lambda base, f: speed(base, f / base_hz[id(base)])
    base_hz = {id(harp): 369.99, id(bass): 92.50, id(bell): 1479.98}   # F#4, F#2, F#6
    hz = lambda n: 440 * 2 ** ((n - 69) / 12)                          # MIDI → Гц
    beat = 60 / 84
    chords = [(53, [65, 69, 72, 76]), (48, [64, 67, 72, 76]), (45, [64, 69, 72, 76]),
              (43, [62, 67, 71, 74]), (53, [65, 69, 72, 77])]          # F C Am G F
    pattern = [0, 1, 2, 3, 2, 1, 2, 3]
    melody = {0: 81, 3: 79, 4: 76, 6: 77, 8: 76, 11: 74, 12: 72, 14: 74, 16: 77, 19: 76}
    out = np.zeros((int(length * RATE) + RATE * 3, 2))

    def put(t, a, g):
        i = int(t * RATE)
        out[i:i + len(a)] += a[:len(out) - i] * g

    for bar, (root, tones) in enumerate(chords):
        t0 = bar * 4 * beat
        put(t0, note(bass, hz(root)), 0.35)
        put(t0 + 2 * beat, note(bass, hz(root)), 0.25)
        for i, p in enumerate(pattern):
            put(t0 + i * beat / 2, note(harp, hz(tones[p])), 0.8 if i % 2 else 1.0)
    for b, n in melody.items():
        put(b * beat, note(bell, hz(n + 12)), 0.25)
    out = reverb(out)
    return out / np.sqrt((out[:int(MUSIC_END * RATE)] ** 2).mean())   # средняя громкость = 1


# ------------------------------------------------------------------ сведение
def mix(length):
    out = np.zeros((int(length * RATE) + RATE * 12, 2))
    for cue in CUES:
        t, name, db, k, pan = cue[:5]
        a = synth(name, k) if '/' not in name else speed(load(name), k)
        if len(cue) > 5:                          # обрезать по длине с плавным концом
            n = min(len(a), int(cue[5] * RATE))
            a = a[:n] * env(n, 0.15, min(0.6, cue[5] / 2))[:, None]
        g = 10 ** (db / 20)
        gl, gr = g * min(1, 1 - pan), g * min(1, 1 + pan)
        i = int(t * RATE)
        out[i:i + len(a)] += a * [gl, gr]

    m = music(length)[:len(out)]
    t = np.arange(len(m)) / RATE
    g = np.clip(t / 0.6, 0, 1) * np.clip((MUSIC_END - t) / 0.35, 0, 1)
    for a, b, k in DUCK:                          # мягко прибрать музыку под важные звуки
        inside = np.clip(np.minimum(t - a + 0.15, b + 0.15 - t) / 0.15, 0, 1)
        g *= 1 - (1 - k) * inside
    out[:len(m)] += m * (10 ** (MUSIC_DB / 20)) * g[:, None]

    out = out[:int(length * RATE)]
    out /= np.percentile(np.abs(out), 99.95)     # громко, но без перегруза:
    return 0.85 * np.tanh(out)                   # пики мягко сжаты, с запасом под AAC


def main(a):
    src = a[0]
    out = a[a.index('--out') + 1] if '--out' in a else os.path.join(
        ROOT, 'videos', os.path.splitext(os.path.basename(src))[0] + '_sound.mp4')
    length = float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration',
                                   '-of', 'csv=p=0', src], capture_output=True, text=True).stdout)
    fetch()
    audio = mix(length)
    os.makedirs(os.path.dirname(out), exist_ok=True)
    wav = out[:-4] + '.f32'
    audio.astype(np.float32).tofile(wav)
    for path, vf in ((out, None), (out[:-4] + '_vertical.mp4', 'transpose=1')):
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', src, '-f', 'f32le', '-ar', str(RATE),
                        '-ac', '2', '-i', wav, '-map', '0:v', '-map', '1:a']
                       + (['-vf', vf] if vf else [])
                       + ['-c:v', 'libx264', '-crf', '18', '-preset', 'slow', '-pix_fmt', 'yuv420p',
                          '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart', path],
                       check=True)
        print(path)
    os.remove(wav)


if __name__ == '__main__':
    main(sys.argv[1:])
