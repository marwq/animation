#!/usr/bin/env python3
"""Звук для мультика: звуки Minecraft, свои эффекты и тихая музыка на нотных блоках.

    python3 tools/add_sound.py ВИДЕО.mp4 [--cues sound/cues/ИМЯ.json] [--out videos/ИМЯ_sound.mp4]

Звуки Minecraft скачиваются с официального сервера Mojang в sound/minecraft/
(папка в .gitignore — это файлы Mojang). Свисты, «вуш» и «бум» синтезируются здесь
же, музыка — мелодия из звуков нотных блоков (арфа, бас, колокольчик) с эхом,
своя, поэтому без претензий за чужую музыку на YouTube.

Делает два файла: в той же ориентации, что исходник, и вертикальный 1080×1920
(исходник лежит на боку: небо слева). Расстановка звуков для каждого видео — свой
файл sound/cues/<имя видео>.json (см. load_cues): время в секундах, громкость в дБ.
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



def load_cues(path):
    """Расстановка звуков для одного видео: JSON с полями
    cues — список [время, звук, дБ, скорость/высота, панорама -1…1, длина?, "заметки"…]
           (звук — путь из Minecraft, например "mob/cat/meow1", или свой: whoosh, boom,
           whistle — свист падения, rise — свист взлёта);
    music_db — громкость музыки, music_end — когда она стихает,
    duck — где её прибрать под важные звуки: [начало, конец, доля];
    transpose — сдвиг мелодии в полутонах, чтобы у роликов она была разной."""
    d = json.load(open(path, encoding='utf-8'))
    cues = []
    for c in d['cues']:
        t, name, db, k, pan, *rest = c
        length = next((x for x in rest if not isinstance(x, str)), None)
        cues.append((t, name, db, k, pan, length))
    return {'cues': cues, 'music_db': d.get('music_db', -28), 'music_end': d['music_end'],
            'duck': d.get('duck', []), 'transpose': d.get('transpose', 0)}


# ------------------------------------------------------------------ звуки Minecraft
def fetch(cues):
    """Скачать нужные звуки с серверов Mojang (как это делает лаунчер)."""
    need = {c[1] for c in cues if '/' in c[1]} | {'note/harp', 'note/bass', 'note/bell'}
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
    if name in ('whistle', 'rise'):              # свист падения — вниз, взлёта — вверх
        n = int((1.0 if name == 'whistle' else 0.7) / k * RATE)
        t = np.arange(n) / RATE
        f = 1900 * np.exp(-t * 1.5) + 250 if name == 'whistle' else 400 * np.exp(t * k * 2.6)
        f = (f + 18 * np.sin(2 * np.pi * 6 * t)) * k
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


def music(length, end, transpose=0):
    """Спокойная мелодия на нотных блоках: арпеджио арфы, бас, колокольчик сверху."""
    harp, bass, bell = load('note/harp'), load('note/bass'), load('note/bell')
    note = lambda base, f: speed(base, f / base_hz[id(base)])
    base_hz = {id(harp): 369.99, id(bass): 92.50, id(bell): 1479.98}   # F#4, F#2, F#6
    hz = lambda n: 440 * 2 ** ((n + transpose - 69) / 12)              # MIDI → Гц
    beat = 60 / 84
    chords = [(53, [65, 69, 72, 76]), (48, [64, 67, 72, 76]), (45, [64, 69, 72, 76]),
              (43, [62, 67, 71, 74]), (53, [65, 69, 72, 77])]          # F C Am G F
    pattern = [0, 1, 2, 3, 2, 1, 2, 3]
    melody = {0: 81, 3: 79, 4: 76, 6: 77, 8: 76, 11: 74, 12: 72, 14: 74, 16: 77, 19: 76}
    out = np.zeros((int(length * RATE) + RATE * 3, 2))

    def put(t, a, g):
        i = int(t * RATE)
        if i < len(out):                          # ноты за концом ролика не нужны
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
    return out / np.sqrt((out[:int(end * RATE)] ** 2).mean())         # средняя громкость = 1


# ------------------------------------------------------------------ сведение
def mix(length, plan):
    out = np.zeros((int(length * RATE) + RATE * 12, 2))
    for t, name, db, k, pan, cut in plan['cues']:
        a = synth(name, k) if '/' not in name else speed(load(name), k)
        if cut:                                   # обрезать по длине с плавным концом
            n = min(len(a), int(cut * RATE))
            a = a[:n] * env(n, 0.15, min(0.6, cut / 2))[:, None]
        g = 10 ** (db / 20)
        gl, gr = g * min(1, 1 - pan), g * min(1, 1 + pan)
        i = int(t * RATE)
        out[i:i + len(a)] += a * [gl, gr]

    end = plan['music_end']
    m = music(length, end, plan['transpose'])[:len(out)]
    t = np.arange(len(m)) / RATE
    g = np.clip(t / 0.6, 0, 1) * np.clip((end - t) / 0.35, 0, 1)
    for a, b, k in plan['duck']:                  # мягко прибрать музыку под важные звуки
        inside = np.clip(np.minimum(t - a + 0.15, b + 0.15 - t) / 0.15, 0, 1)
        g *= 1 - (1 - k) * inside
    out[:len(m)] += m * (10 ** (plan['music_db'] / 20)) * g[:, None]

    out = out[:int(length * RATE)]
    out /= np.percentile(np.abs(out), 99.95)     # громко, но без перегруза:
    out = 0.85 * np.tanh(out)                    # пики мягко сжаты, с запасом под AAC
    out[-int(0.03 * RATE):] *= np.linspace(1, 0, int(0.03 * RATE))[:, None]   # без щелчка в конце
    return out


def main(a):
    src = a[0]
    name = os.path.splitext(os.path.basename(src))[0]
    out = a[a.index('--out') + 1] if '--out' in a else os.path.join(ROOT, 'videos', name + '_sound.mp4')
    cues = a[a.index('--cues') + 1] if '--cues' in a else os.path.join(ROOT, 'sound', 'cues', name + '.json')
    plan = load_cues(cues)
    length = float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration',
                                   '-of', 'csv=p=0', src], capture_output=True, text=True).stdout)
    fetch(plan['cues'])
    audio = mix(length, plan)
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
