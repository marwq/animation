"""Озвучка: edge-tts по репликам из script.py, тайминги каждого слова, общая дорожка.

Результат:
  build/tts/<id>-<hash>.mp3/.json  — кэш реплик (повторно не запрашиваются)
  build/timeline.json              — начало/конец реплик и слов на общей шкале
  build/voice.wav                  — голос целиком, 48 кГц моно, обработанный

Запуск:  python tts.py [--voice en-US-ChristopherNeural] [--rate -4%] [--pitch -2Hz]
Через прокси с собственным CA:  EDGE_CA_BUNDLE=/path/ca.crt python tts.py
"""
import argparse
import asyncio
import difflib
import hashlib
import json
import os
import re
import ssl
import subprocess
import sys

import numpy as np

import script

HERE = os.path.dirname(os.path.abspath(__file__))
BUILD = os.path.join(HERE, "build")
SR = 48000
FORMAT = "audio-24khz-96kbitrate-mono-mp3"


def spoken_text(text, opts):
    if "say" in opts:
        return opts["say"]
    return text.replace("*", "").replace("“", "").replace("”", "")


def display_words(text):
    """Слова для субтитров: [(слово, акцент)]."""
    out, emph = [], False
    for tok in text.split():
        start = tok.startswith("*")
        if start:
            emph = True
        word = tok.replace("*", "")
        out.append((word, emph))
        if tok.endswith("*") or tok.rstrip(".,!?”").endswith("*"):
            emph = False
    return out


def norm(w):
    return re.sub(r"[^a-z0-9]", "", w.lower())


def setup_edge():
    import aiohttp
    import edge_tts
    import edge_tts.communicate as comm

    ca = os.environ.get("EDGE_CA_BUNDLE")
    if ca:
        comm._SSL_CTX = ssl.create_default_context(cafile=ca)
    # Библиотека всегда просит 48 кбит/с; подменяем формат в запросе на 96 кбит/с.
    comm.MP3_BITRATE_BPS = 96_000
    send = aiohttp.ClientWebSocketResponse.send_str

    async def send_str(self, data, *a, **k):
        return await send(self, data.replace("audio-24khz-48kbitrate-mono-mp3", FORMAT), *a, **k)

    aiohttp.ClientWebSocketResponse.send_str = send_str
    return edge_tts


async def synth(edge_tts, text, voice, rate, pitch, mp3_path):
    proxy = os.environ.get("HTTPS_PROXY") or None
    comm = edge_tts.Communicate(text, voice, rate=rate, pitch=pitch,
                                boundary="WordBoundary", proxy=proxy)
    audio, words = bytearray(), []
    async for chunk in comm.stream():
        if chunk["type"] == "audio":
            audio += chunk["data"]
        elif chunk["type"] == "WordBoundary":
            words.append({"t": chunk["offset"] / 1e7, "d": chunk["duration"] / 1e7,
                          "w": chunk["text"]})
    with open(mp3_path, "wb") as f:
        f.write(audio)
    return words


def decode(mp3_path):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", mp3_path, "-ac", "1", "-ar", str(SR),
                          "-f", "f32le", "-"], capture_output=True, check=True).stdout
    return np.frombuffer(raw, dtype=np.float32).copy()


def speech_bounds(x, thr_db=-42.0):
    """Первый и последний отсчёт речи (по огибающей 10 мс)."""
    hop = SR // 100
    n = len(x) // hop
    env = np.sqrt((x[: n * hop].reshape(n, hop) ** 2).mean(1) + 1e-12)
    db = 20 * np.log10(env)
    idx = np.where(db > thr_db)[0]
    if len(idx) == 0:
        return 0, len(x)
    a = max(0, idx[0] * hop - int(0.03 * SR))
    b = min(len(x), (idx[-1] + 1) * hop + int(0.08 * SR))
    return a, b


def align(disp, spoken):
    """Время каждого слова субтитра по словам, которые вернул синтезатор."""
    dn = [norm(w) for w, _ in disp]
    sn = [norm(w["w"]) for w in spoken]
    times = [None] * len(disp)
    sm = difflib.SequenceMatcher(a=dn, b=sn, autojunk=False)
    for tag, i1, i2, j1, j2 in sm.get_opcodes():
        if tag == "equal":
            for k in range(i2 - i1):
                s = spoken[j1 + k]
                times[i1 + k] = (s["t"], s["t"] + s["d"])
        elif j2 > j1:
            t0, t1 = spoken[j1]["t"], spoken[j2 - 1]["t"] + spoken[j2 - 1]["d"]
            n = i2 - i1
            for k in range(n):
                times[i1 + k] = (t0 + (t1 - t0) * k / n, t0 + (t1 - t0) * (k + 1) / n)
    # заполнить пропуски соседними значениями
    for i in range(len(times)):
        if times[i] is None:
            prev = next((times[j] for j in range(i - 1, -1, -1) if times[j]), (0, 0))
            times[i] = (prev[1], prev[1] + 0.2)
    return times


def process_voice(src, dst):
    chain = ",".join([
        "highpass=f=70",
        "equalizer=f=160:t=q:w=1.0:g=2.5",     # теплота
        "equalizer=f=420:t=q:w=1.4:g=-2.0",    # убрать «картонность»
        "equalizer=f=3200:t=q:w=1.2:g=2.0",    # разборчивость
        "equalizer=f=7500:t=q:w=1.5:g=-2.5",   # мягче сибилянты
        "acompressor=threshold=-20dB:ratio=3:attack=8:release=120:makeup=3",
        "aecho=0.8:0.5:38|61:0.12|0.07",       # лёгкая комната
        "loudnorm=I=-17:TP=-1.5:LRA=7",
    ])
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", "1",
                    "-i", src, "-af", chain, "-ar", str(SR), "-ac", "1", dst], check=True)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--voice", default="en-US-ChristopherNeural")
    ap.add_argument("--rate", default="-2%")
    ap.add_argument("--pitch", default="-2Hz")
    args = ap.parse_args()

    os.makedirs(os.path.join(BUILD, "tts"), exist_ok=True)
    edge_tts = setup_edge()

    clips, t = [], script.LEAD_IN
    timeline = {"lines": [], "voice": args.voice}
    for lid, text, gap, opts in script.LINES:
        say = spoken_text(text, opts)
        key = hashlib.sha1(f"{args.voice}|{args.rate}|{args.pitch}|{FORMAT}|{say}".encode()).hexdigest()[:10]
        mp3 = os.path.join(BUILD, "tts", f"{lid}-{key}.mp3")
        meta = mp3[:-4] + ".json"
        if not (os.path.exists(mp3) and os.path.exists(meta)):
            for attempt in range(4):
                try:
                    words = asyncio.run(synth(edge_tts, say, args.voice, args.rate, args.pitch, mp3))
                    break
                except Exception as e:  # сеть иногда рвётся
                    print("retry", lid, e, file=sys.stderr)
            json.dump(words, open(meta, "w"))
        words = json.load(open(meta))
        x = decode(mp3)
        a, b = speech_bounds(x)
        x = x[a:b]
        lead = a / SR
        t += script.PRE_GAP.get(lid, 0.0)
        start = t
        disp = display_words(text)
        wt = align(disp, words)
        timeline["lines"].append({
            "id": lid, "text": text, "start": round(start, 4), "end": round(start + len(x) / SR, 4),
            "card": opts.get("card"),
            "words": [{"w": w, "e": e, "t0": round(start + max(0, t0 - lead), 4),
                       "t1": round(start + max(0, t1 - lead), 4)} for (w, e), (t0, t1) in zip(disp, wt)],
        })
        clips.append((start, x))
        t = start + len(x) / SR + gap * script.GAP_SCALE
        print(f"{lid:4s} {start:7.2f}s  {len(x)/SR:5.2f}s  {text[:60]}")

    total = t + 0.5
    timeline["duration"] = round(total, 3)
    voice = np.zeros(int(total * SR) + SR, dtype=np.float32)
    for start, x in clips:
        i = int(start * SR)
        voice[i:i + len(x)] += x
    raw = os.path.join(BUILD, "voice_raw.f32")
    voice.tofile(raw)
    process_voice(raw, os.path.join(BUILD, "voice.wav"))
    json.dump(timeline, open(os.path.join(BUILD, "timeline.json"), "w"), indent=1)
    print(f"total {total:.1f}s, {sum(len(l[1].split()) for l in script.LINES)} words")


if __name__ == "__main__":
    main()
