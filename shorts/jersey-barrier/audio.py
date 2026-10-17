# Звуковая дорожка Short: озвучка + шумовые эффекты + музыкальная подложка → mix.wav (48 кГц, стерео).
#
# Эффекты — смесь записей CC0 (Kenney Impact/Interface Sounds) и синтеза (мотор, шины, свист, «бум»).
# Моменты ударов и смен планов берутся из events.json (shots.events()), реплики — из voice/timeline.json.
# Запуск: ASSETS=... python audio.py <voice_takes_dir> <out.wav>
import sys, os, json, glob, random
import numpy as np
import librosa
import pyloudnorm as pyln
import soundfile as sf
from scipy import signal

HERE = os.path.dirname(os.path.abspath(__file__))
ASSETS = os.environ.get('ASSETS', os.path.join(HERE, 'assets'))
SR = 48000
DUR = 28.0
N = int(DUR * SR)
rng = np.random.default_rng(7)
EV = json.load(open(os.path.join(HERE, 'events.json')))
TL = json.load(open(os.path.join(HERE, 'voice', 'timeline.json')))


def T(sec):
    return np.arange(int(sec * SR)) / SR


def bus():
    return np.zeros((2, N))


def place(b, x, t, gain_db=0.0, pan=0.0):
    """Вставить моно-сигнал x в стерео-шину b с момента t (с), панорама −1…1."""
    x = np.asarray(x, dtype=np.float64) * 10 ** (gain_db / 20)
    i0 = int(round(t * SR))
    if i0 < 0:
        x, i0 = x[-i0:], 0
    i1 = min(N, i0 + len(x))
    if i1 <= i0:
        return
    l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
    b[0, i0:i1] += x[:i1 - i0] * l * 1.414
    b[1, i0:i1] += x[:i1 - i0] * r * 1.414


def sos(kind, f, order=4):
    return signal.butter(order, f, btype=kind, fs=SR, output='sos')


def filt(x, kind, f, order=4):
    return signal.sosfilt(sos(kind, f, order), x)


def env(n, a, d, curve=3.0):
    """Атака a и спад d (с) на длине n отсчётов."""
    t = np.arange(n) / SR
    e = np.minimum(1.0, t / max(a, 1e-4))
    return e * np.exp(-np.maximum(0, t - a) * curve / max(d, 1e-4))


def fade(x, fi=0.01, fo=0.05):
    x = x.copy()
    a, b = int(fi * SR), int(fo * SR)
    if a:
        x[:a] *= np.linspace(0, 1, a)
    if b:
        x[-b:] *= np.linspace(1, 0, b)
    return x


def load(name, rate=1.0):
    """Звук из пакетов Kenney; rate < 1 — медленнее и ниже (как замедленная плёнка)."""
    p = glob.glob(os.path.join(ASSETS, 'sfx', '**', name), recursive=True)[0]
    x, _ = librosa.load(p, sr=int(SR / rate), mono=True)
    return x / (np.abs(x).max() + 1e-9)


def noise(sec, color='white'):
    x = rng.standard_normal(int(sec * SR))
    if color == 'pink':
        b, a = [0.049922035, -0.095993537, 0.050612699, -0.004408786], [1, -2.494956002, 2.017265875, -0.522189400]
        x = signal.lfilter(b, a, x)
    if color == 'brown':
        x = np.cumsum(x)
        x = filt(x - np.convolve(x, np.ones(2001) / 2001, 'same'), 'highpass', 20, 2)
    return x / (np.abs(x).max() + 1e-9)


# ---------------------------------------------------------------- синтез

def whoosh(sec, f0=300, f1=3500, peak=0.55):
    """Свист пролёта: полосовой шум со скользящей частотой."""
    x = noise(sec)
    n = len(x)
    out = np.zeros(n)
    hop = 512
    fc = np.geomspace(f0, f1, n // hop + 1)
    zi = None
    for k in range(0, n, hop):
        s = signal.butter(2, [fc[k // hop] * 0.7, min(fc[k // hop] * 1.4, SR / 2 - 100)], 'bandpass', fs=SR, output='sos')
        seg, zi = signal.sosfilt(s, x[k:k + hop], zi=zi if zi is not None else signal.sosfilt_zi(s) * 0)
        out[k:k + hop] = seg
    t = np.linspace(0, 1, n)
    e = np.where(t < peak, (t / peak) ** 2, ((1 - t) / (1 - peak)) ** 1.5)
    return out * e / (np.abs(out).max() + 1e-9)


def boom(sec=1.6, f0=75, f1=28):
    """Низкий удар: синус со спадом частоты + щелчок."""
    t = T(sec)
    f = f1 + (f0 - f1) * np.exp(-t * 6)
    ph = 2 * np.pi * np.cumsum(f) / SR
    x = np.sin(ph) * env(len(t), 0.003, sec * 0.6, 3.5)
    x += 0.3 * filt(noise(sec), 'lowpass', 2000) * env(len(t), 0.001, 0.05, 5)
    return np.tanh(x * 1.6)


def engine(sec, rpm0, rpm1, rough=0.25):
    """Мотор: гармоники частоты вспышек 4-цилиндрового двигателя, рваная амплитуда, перегруз."""
    t = T(sec)
    rpm = np.linspace(rpm0, rpm1, len(t))
    f = rpm / 60 * 2
    ph = 2 * np.pi * np.cumsum(f) / SR
    x = sum(np.sin(ph * h + h) / h ** 0.8 for h in range(1, 9))
    x *= 1 + rough * filt(noise(sec), 'lowpass', 40)
    x = np.tanh(x * 0.9)
    return filt(x, 'lowpass', 2200)


def tires(sec, grass=False):
    """Шум шин: по асфальту — шипение, по траве — низкий рокот с толчками."""
    if grass:
        x = filt(noise(sec, 'brown'), 'lowpass', 400)
        bumps = np.zeros(len(x))
        for k in rng.uniform(0, sec, int(sec * 9)):
            i = int(k * SR)
            n = min(len(x) - i, int(0.08 * SR))
            bumps[i:i + n] += np.sin(2 * np.pi * 50 * np.arange(n) / SR) * np.exp(-np.arange(n) / SR * 40)
        x = x + 0.8 * bumps
    else:
        x = filt(noise(sec, 'pink'), 'bandpass', [300, 3000], 2)
    return x / (np.abs(x).max() + 1e-9)


def squeal(sec, f=1100, rate=1.0):
    """Визг шины: несколько расстроенных тонов с вибрато и шумом."""
    t = T(sec / rate)
    vib = 1 + 0.02 * np.sin(2 * np.pi * 7 * t) + 0.01 * filt(noise(sec / rate), 'lowpass', 20)
    x = sum(np.sin(2 * np.pi * np.cumsum(f * rate * k * vib) / SR) for k in (1.0, 1.013, 1.5)) / 3
    x += 0.4 * filt(noise(sec / rate), 'bandpass', [600 * rate, 3000 * rate], 2)
    return x * env(len(t), 0.05, sec / rate, 1.5)


def scrape(sec):
    """Скрежет металла по бетону: полосовой шум с рваной модуляцией и резонансами."""
    x = filt(noise(sec), 'bandpass', [400, 5000], 2)
    am = 0.5 + 0.5 * np.abs(filt(noise(sec), 'lowpass', 60)) * 4
    x *= np.clip(am, 0, 1.5)
    for fr in (1830, 2470, 3310):
        b, a = signal.iirpeak(fr, 25, SR)
        x += 0.6 * signal.lfilter(b, a, x)
    return x * env(len(x), 0.005, sec, 2.0) / (np.abs(x).max() + 1e-9)


def horn(sec):
    t = T(sec)
    x = signal.square(2 * np.pi * 415 * t) + signal.square(2 * np.pi * 523 * t)
    x = filt(x, 'bandpass', [300, 2500], 2)
    return fade(x / np.abs(x).max(), 0.01, 0.06)


def ring(sec, f=3300):
    t = T(sec)
    return np.sin(2 * np.pi * f * t) * env(len(t), 0.2, sec, 1.2)


def riser(sec):
    t = T(sec)
    f = np.geomspace(180, 1400, len(t))
    x = 0.5 * np.sin(2 * np.pi * np.cumsum(f) / SR) + filt(noise(sec), 'highpass', 1500) * 0.6
    return x * (t / sec) ** 2.2


def reverb(x, sec=1.8, wet=0.35):
    ir = rng.standard_normal(int(sec * SR)) * np.exp(-np.arange(int(sec * SR)) / SR * 4)
    ir = filt(ir, 'lowpass', 5000)
    y = signal.fftconvolve(x, ir)[:len(x) + int(sec * SR)]
    y /= np.abs(y).max() + 1e-9
    out = np.zeros(len(y))
    out[:len(x)] = x * (1 - wet)
    return out + y * wet


def sprinkle(b, names, t0, sec, count, gain_db, rate_range=(0.8, 1.4), decay=2.0):
    """Россыпь коротких звуков (стекло, обломки) с убывающей плотностью."""
    for k in range(count):
        u = rng.random() ** decay
        x = load(rng.choice(names), rate=rng.uniform(*rate_range))
        place(b, x, t0 + u * sec, gain_db - 10 * u + rng.uniform(-3, 0), pan=rng.uniform(-0.7, 0.7))


# ---------------------------------------------------------------- сцена за сценой

def crash(b, t, big=True, slow=False):
    """Лобовой удар: бум, хруст металла, стекло, обломки; slow — «замедленная» версия."""
    r = 0.6 if slow else 1.0
    place(b, boom(2.2 if slow else 1.6, 70 * r, 26), t, 0)
    for k, nm in enumerate(['impactMetal_heavy_000.ogg', 'impactMetal_heavy_002.ogg', 'impactPlate_heavy_001.ogg',
                            'impactPunch_heavy_002.ogg', 'impactMetal_heavy_004.ogg']):
        place(b, reverb(load(nm, rate=(0.55 if slow else 0.8) + 0.08 * k), 1.2, 0.25), t + 0.012 * k, -2 - k, pan=rng.uniform(-0.4, 0.4))
    crunch = filt(noise(0.6), 'bandpass', [150, 4000], 2) * env(int(0.6 * SR), 0.002, 0.5, 4)
    place(b, crunch, t, -4)
    for k, nm in enumerate(['impactGlass_heavy_000.ogg', 'impactGlass_heavy_002.ogg', 'impactGlass_heavy_004.ogg']):
        place(b, load(nm, rate=(0.7 if slow else 1.0) + 0.1 * k), t + 0.02 + 0.03 * k, -5, pan=(-0.5, 0.0, 0.5)[k])
    glass = [f'impactGlass_light_00{i}.ogg' for i in range(5)] + [f'glass_00{i}.ogg' for i in range(1, 7)]
    sprinkle(b, glass, t + 0.05, 2.2 if slow else 1.5, 28 if big else 12, -12, (0.6, 1.1) if slow else (0.9, 1.5))
    debris = [f'impactPlate_light_00{i}.ogg' for i in range(5)] + [f'impactGeneric_light_00{i}.ogg' for i in range(5)]
    sprinkle(b, debris, t + 0.15, 1.8, 18 if big else 8, -13, (0.6, 1.0))


def build():
    sfx, amb = bus(), bus()
    hook, wall, climb, replay = EV['hook_impact'], EV['wall_impact'], EV['climb_contact'], EV['replay_impact']
    cuts = EV['cuts']

    # 1. Хук: мотор на высоких, рокот травы, гудок внедорожника, удар, замедление, звон в ушах
    place(sfx, fade(engine(hook + 0.05, 5200, 6100), 0.0, 0.04), 0.0, -8)
    place(sfx, fade(tires(hook + 0.05, grass=True), 0.0, 0.04), 0.0, -9)
    place(sfx, whoosh(0.9, 400, 2500, 0.7), -0.2, -10, pan=-0.4)
    place(sfx, horn(0.42), hook - 0.5, -12, pan=-0.3)
    crash(sfx, hook, big=True, slow=True)
    place(sfx, ring(1.3), hook + 0.08, -30)
    place(sfx, fade(squeal(1.0, 900, 0.75), 0.02, 0.3), hook + 1.0, -16, pan=0.3)

    # 2. Пролёт над шоссе
    place(sfx, whoosh(1.1, 250, 4000, 0.65), cuts[0] - 0.45, -9, pan=0.5)
    place(amb, fade(filt(noise(cuts[2] - cuts[0] + 0.5, 'pink'), 'lowpass', 900), 0.3, 0.4), cuts[0], -24)
    for k, tt in enumerate((3.4, 4.3, 5.0)):
        place(sfx, whoosh(0.8, 300, 1800, 0.5) * 0.7, tt, -16, pan=(-0.6, 0.6, -0.2)[k])

    # 3. Нырок к основанию и подсветка скоса
    place(sfx, whoosh(0.7, 500, 5000, 0.8), cuts[1] - 0.25, -10)
    place(sfx, boom(0.9, 90, 40) * 0.6, cuts[1] + 0.55, -14)
    place(sfx, load('confirmation_002.ogg'), EV['slope_reveal'], -10)
    place(sfx, load('click_003.ogg'), EV['slope_reveal'] + 0.12, -12)

    # 4. Плоская стена: мотор, удар, скрежет, искры
    place(sfx, whoosh(0.6, 500, 3000, 0.8), cuts[2] - 0.2, -12)
    place(sfx, fade(engine(wall - cuts[2], 4200, 4600), 0.1, 0.03), cuts[2], -11)
    place(sfx, fade(tires(wall - cuts[2]), 0.1, 0.03), cuts[2], -18)
    place(sfx, boom(1.4, 80, 30), wall, -2)
    place(sfx, reverb(load('impactMetal_heavy_001.ogg', 0.6), 1.0, 0.3), wall, -2)
    place(sfx, load('impactPlate_heavy_003.ogg', 0.7), wall + 0.01, -5)
    place(sfx, scrape(1.0), wall + 0.02, -6, pan=-0.3)
    sprinkle(sfx, [f'impactGlass_light_00{i}.ogg' for i in range(5)], wall + 0.05, 1.0, 10, -15, (0.6, 1.0))

    # 5a. Колесо на скосе — замедленно: низкий визг резины, гул
    place(sfx, whoosh(0.6, 600, 3000, 0.8), cuts[3] - 0.2, -12)
    place(sfx, fade(engine(climb - cuts[3] + 0.2, 1500, 1600, 0.4), 0.2, 0.3), cuts[3], -14)
    place(sfx, fade(squeal(2.6, 1000, 0.45), 0.05, 0.8), climb, -11, pan=-0.3)
    place(sfx, reverb(load('impactPunch_heavy_000.ogg', 0.5), 1.4, 0.4), climb, -6)
    place(sfx, boom(2.5, 55, 25) * 0.7, climb, -10)
    place(amb, fade(filt(noise(cuts[4] - climb, 'brown'), 'lowpass', 200), 0.4, 0.5), climb, -22)
    # 5b. Обратно в полосу — реальное время
    place(sfx, whoosh(0.8, 300, 3500, 0.6), cuts[4] - 0.3, -10, pan=0.5)
    place(sfx, fade(engine(cuts[5] - cuts[4], 3600, 3800), 0.05, 0.2), cuts[4], -14)
    place(sfx, fade(tires(cuts[5] - cuts[4]), 0.05, 0.2), cuts[4], -20)

    # 6. Повтор: нарастание и удар
    place(sfx, riser(replay - cuts[5] + 0.05), cuts[5], -14)
    place(sfx, fade(engine(replay - cuts[5], 5200, 6000), 0.05, 0.03), cuts[5], -12)
    place(sfx, horn(0.35), replay - 0.45, -13, pan=-0.3)
    crash(sfx, replay, big=True, slow=True)

    # 7. Реальный случай: тихо, ветер, глухой удар на вспышке кольца
    place(amb, fade(filt(noise(cuts[7] - cuts[6], 'pink'), 'bandpass', [200, 1200], 2), 0.6, 0.6), cuts[6], -27)
    place(sfx, whoosh(0.6, 2000, 400, 0.3), EV['red_path'] - 0.05, -16)
    place(sfx, boom(1.4, 60, 30), EV['ring_pulse'], -9)

    # 8. Финал: пролёт машины и удар под титр
    place(sfx, whoosh(0.9, 300, 3000, 0.7), cuts[7] - 0.3, -10)
    place(sfx, whoosh(0.7, 400, 2500, 0.5), cuts[7] + 0.5, -12, pan=0.6)
    place(amb, fade(filt(noise(DUR - cuts[7], 'pink'), 'lowpass', 900), 0.3, 0.6), cuts[7], -24)
    t_title = TL['title_time']
    place(sfx, riser(0.6) * 0.6, t_title - 0.6, -16)
    place(sfx, boom(1.8, 70, 30), t_title, -5)
    place(sfx, reverb(load('impactBell_heavy_001.ogg', 0.8), 1.5, 0.4), t_title, -16)
    return sfx, amb


def music():
    """Тёмная пульсирующая подложка 120 BPM: суб-бас, бочка, тики; в плане 7 — только пэд."""
    m = bus()
    beat = 0.5
    cuts = EV['cuts']
    t = T(DUR)
    # пэд ля-минор
    pad = np.zeros(N)
    for fr in (110.0, 130.81, 164.81, 220.0):
        for det in (-0.12, 0.0, 0.12):
            pad += signal.sawtooth(2 * np.pi * (fr + det) * t + rng.uniform(0, 6))
    pad = filt(pad, 'lowpass', 700) / 12
    pad *= 0.5 + 0.5 * np.sin(2 * np.pi * t / 8) ** 2
    place(m, pad, 0, -26)
    place(m, pad * (np.abs(t - (cuts[6] + cuts[7]) / 2) < (cuts[7] - cuts[6]) / 2), 0, -20)
    kick = boom(0.35, 120, 45)
    sub = np.sin(2 * np.pi * 55 * T(0.45)) * env(int(0.45 * SR), 0.01, 0.4, 3)
    tick = filt(noise(0.03), 'highpass', 7000) * env(int(0.03 * SR), 0.001, 0.03, 5)
    sections = [(cuts[0], cuts[5]), (cuts[7], DUR)]
    for a, b in sections:
        k = 0
        tt = a
        while tt < b - 0.05:
            if k % 2 == 0:
                place(m, kick, tt, -13)
            place(m, sub, tt + beat / 2, -16)
            for s in range(4):
                place(m, tick, tt + s * beat / 4, -24 if s % 2 else -28, pan=0.3 if s % 2 else -0.3)
            tt += beat
            k += 1
    return m


def voice_track(takes):
    v = np.zeros(N)
    for line in TL['lines']:
        x, _ = librosa.load(os.path.join(takes, line['file']), sr=SR, mono=True)
        x = x[:int(line['speech_end'] * SR) + int(0.12 * SR)]
        x = filt(x, 'highpass', 75, 2)
        b, a = signal.iirpeak(3200, 1.2, SR)
        x = x + 0.15 * signal.lfilter(b, a, x)
        x = fade(x, 0.005, 0.08)
        x /= np.abs(x).max() + 1e-9
        i0 = int(line['start'] * SR)
        v[i0:i0 + len(x)] += x[:N - i0]
    # мягкая компрессия
    e = np.sqrt(np.maximum(signal.sosfilt(sos('lowpass', 15, 2), v ** 2), 0) + 1e-9)
    g = np.minimum(1.0, (0.18 / e) ** 0.5)
    return v * g


def main():
    takes, out = sys.argv[1], sys.argv[2]
    meter = pyln.Meter(SR)
    v = voice_track(takes)
    v = pyln.normalize.loudness(v, meter.integrated_loudness(v), -16.0)
    sfx, amb = build()
    m = music()
    # музыка и эмбиент приглушаются под голосом
    ve = np.sqrt(np.maximum(signal.sosfilt(sos('lowpass', 8, 2), v ** 2), 0) + 1e-12)
    duck = 1 - 0.55 * np.clip(ve / (ve.max() * 0.3), 0, 1)
    duck_sfx = 1 - 0.45 * np.clip(ve / (ve.max() * 0.3), 0, 1)     # эффекты чуть уступают голосу
    mix = np.vstack([v, v]) * 1.0 + sfx * 0.9 * duck_sfx + amb * duck + m * duck
    loud = meter.integrated_loudness(mix.T)
    mix = pyln.normalize.loudness(mix.T, loud, -14.0).T
    peak = np.abs(mix).max()
    if peak > 0.89:                                    # мягкий лимитер вместо клиппинга
        mix = np.tanh(mix / 0.89) * 0.89
    sf.write(out, mix.T.astype(np.float32), SR)
    for name, x in (('voice', np.vstack([v, v])), ('sfx', sfx), ('music', m)):
        sf.write(out.replace('.wav', f'_{name}.wav'), (x.T / (np.abs(x).max() + 1e-9) * 0.8).astype(np.float32), SR)
    print('mix', out, 'LUFS', round(meter.integrated_loudness(mix.T), 1), 'peak', round(float(np.abs(mix).max()), 3))


if __name__ == '__main__':
    main()
