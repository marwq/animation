"""Разметка озвучки: обрезка тишины, проверка распознаванием, раскладка реплик (scenes/timing.layout).

python tools/voice_timing.py            → build/voice/timing.json (+ отчёт о плохих репликах)
"""
import json
import os
import re
import subprocess
import sys

import numpy as np
import soundfile as sf

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT)
from scenes import timing as TM  # noqa: E402

VOICE = os.path.join(ROOT, "build", "voice")
TRIM = os.path.join(VOICE, "trim")
CACHE = os.path.join(VOICE, "asr_cache.json")
SR = 24000



def trim(path, out):
    x, sr = sf.read(path)
    if x.ndim > 1:
        x = x.mean(1)
    env = np.abs(x)
    k = int(sr * 0.01)
    env = np.convolve(env, np.ones(k) / k, mode="same")
    thr = max(env.max() * 0.02, 1e-4)
    idx = np.where(env > thr)[0]
    if len(idx) == 0:
        sf.write(out, x, sr)
        return len(x) / sr
    a = max(0, idx[0] - int(0.04 * sr))
    b = min(len(x), idx[-1] + int(0.08 * sr))
    y = x[a:b]
    fade = int(0.01 * sr)
    y[:fade] *= np.linspace(0, 1, fade)
    y[-fade:] *= np.linspace(1, 0, fade)
    sf.write(out, y, sr)
    return len(y) / sr


def _num(m):
    from num2words import num2words
    txt = m.group(0)
    if ":" in txt or "." in txt:
        a, b = re.split(r"[:.]", txt)[:2]
        return num2words(int(a)) + " " + num2words(int(b))
    return num2words(int(txt.replace(",", "")))


def norm_words(s):
    s = s.lower()
    s = re.sub(r"(\d+)(st|nd|rd|th)\b", lambda m: __import__("num2words").num2words(int(m.group(1)), to="ordinal"), s)
    s = re.sub(r"\d+[:.]\d+|\d[\d,]*", _num, s)
    s = s.replace("-", " ").replace("a.m", "am").replace("p.m", "pm")
    s = re.sub(r"[^a-z' ]", " ", s)
    return [w for w in s.split() if w and w != "and"]


def wer(ref, hyp):
    r, h = norm_words(ref), norm_words(hyp)
    d = list(range(len(h) + 1))
    for i in range(1, len(r) + 1):
        prev, d[0] = d[0], i
        for j in range(1, len(h) + 1):
            cur = min(d[j] + 1, d[j - 1] + 1, prev + (r[i - 1] != h[j - 1]))
            prev, d[j] = d[j], cur
    return d[len(h)] / max(1, len(r))


def asr(paths):
    cache = json.load(open(CACHE)) if os.path.exists(CACHE) else {}
    todo = [p for p in paths if p not in cache or cache[p].get("mtime") != os.path.getmtime(p)]
    if todo:
        from faster_whisper import WhisperModel
        model = WhisperModel("small", device="cpu", compute_type="int8")
        for p in todo:
            raw = subprocess.run(["ffmpeg", "-v", "error", "-i", p, "-f", "s16le", "-ac", "1", "-ar", "16000", "-"],
                                 capture_output=True).stdout
            audio = np.frombuffer(raw, np.int16).astype(np.float32) / 32768.0
            segs, _ = model.transcribe(audio, beam_size=5, word_timestamps=True, language="en")
            words, text = [], []
            for s in segs:
                text.append(s.text)
                for w in s.words:
                    words.append((w.word.strip(), w.start, w.end))
            cache[p] = {"mtime": os.path.getmtime(p), "text": " ".join(text).strip(), "words": words}
            json.dump(cache, open(CACHE, "w"))
            print("asr", os.path.basename(p), "|", cache[p]["text"], flush=True)
    return cache


def align_words(text, asr_words, dur):
    """Слова сценария с временами из распознавания (по порядку; недостающие — равномерно)."""
    ref = text.split()
    out = []
    hw = [(norm_words(w)[0] if norm_words(w) else "", a, b) for w, a, b in asr_words]
    j = 0
    for i, w in enumerate(ref):
        nw = norm_words(w)
        key = nw[0] if nw else ""
        found = None
        for k in range(j, min(j + 4, len(hw))):
            if hw[k][0] == key:
                found = k
                break
        if found is not None:
            out.append([w, hw[found][1], hw[found][2]])
            j = found + 1
        else:
            out.append([w, None, None])
    # заполнить пропуски интерполяцией
    n = len(out)
    for i in range(n):
        if out[i][1] is None:
            a = next((out[k][2] for k in range(i - 1, -1, -1) if out[k][2] is not None), 0.0)
            bidx = next((k for k in range(i + 1, n) if out[k][1] is not None), None)
            b = out[bidx][1] if bidx is not None else dur
            gap_n = (bidx if bidx is not None else n) - i
            step = (b - a) / max(1, gap_n + 0)
            k0 = i
            while k0 < n and out[k0][1] is None:
                out[k0][1] = a + (k0 - i) * step
                out[k0][2] = a + (k0 - i + 1) * step
                k0 += 1
    return out


def main():
    os.makedirs(TRIM, exist_ok=True)
    narr = json.load(open(os.path.join(ROOT, "script", "narration.json")))
    files = {}
    for key, lines in narr.items():
        for i, _ in enumerate(lines):
            p = os.path.join(VOICE, f"{key}_{i:02d}.wav")
            if os.path.exists(p):
                files[(key, i)] = p
    cache = asr(list(files.values()))
    seg_out, bad, report = {}, [], []
    for key in TM.ORDER:
        if key not in narr:
            continue
        lines = narr[key]
        if not all((key, i) in files for i in range(len(lines))):
            continue
        durs, words = [], []
        for i, text in enumerate(lines):
            src = files[(key, i)]
            out = os.path.join(TRIM, f"{key}_{i:02d}.wav")
            d = trim(src, out)
            c = cache[src]
            e = wer(text, c["text"])
            if e > 0.2:
                bad.append((f"{key}_{i:02d}", round(e, 2), c["text"]))
            durs.append(d)
            # времена распознавания относятся к необрезанному файлу — сдвигаем на обрезку
            x, sr = sf.read(src)
            if x.ndim > 1:
                x = x.mean(1)
            env = np.abs(x)
            k = int(sr * 0.01)
            env = np.convolve(env, np.ones(k) / k, mode="same")
            thr = max(env.max() * 0.02, 1e-4)
            idx = np.where(env > thr)[0]
            off = max(0, idx[0] - int(0.04 * sr)) / sr if len(idx) else 0.0
            ws = [(w, max(0.0, a - off), max(0.0, b - off)) for w, a, b in c["words"]]
            words.append(align_words(text, ws, d))
        cues, dur = TM.layout(key, durs)
        L = []
        for i, (a, b) in enumerate(cues):
            L.append({"file": os.path.join(TRIM, f"{key}_{i:02d}.wav"), "start": a, "end": b,
                      "words": [[w, round(a + wa, 3), round(a + wb, 3)] for w, wa, wb in words[i]]})
        seg_out[key] = {"tempo": 1.0, "dur": dur, "lines": L}
        report.append(f"{key}: {sum(durs):5.1f}s speech, segment {dur:5.1f}s  " +
                      " ".join(f"{d:.1f}" for d in durs))
    json.dump({"segments": seg_out}, open(os.path.join(VOICE, "timing.json"), "w"), indent=1)
    print("\n".join(report))
    if bad:
        print("\nBAD:")
        for b in bad:
            print(" ", b)


if __name__ == "__main__":
    main()
