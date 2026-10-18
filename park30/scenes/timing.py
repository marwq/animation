"""Тайминг реплик: из build/voice/timing.json (после озвучки) или оценка по числу слов."""
import json
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TIMING = os.path.join(ROOT, "build", "voice", "timing.json")
NARR = os.path.join(ROOT, "script", "narration.json")

SEG_DUR = {"cold": 10.0, "epi": 12.0, "end": 6.0}
for _d in range(1, 31):
    SEG_DUR["d%02d" % _d] = 30.0

ORDER = ["cold"] + ["d%02d" % d for d in range(1, 31)] + ["epi", "end"]


def load():
    """→ {ключ: {"cues": [(начало, конец)], "words": [(слово, начало, конец)]}}

    Сегменты, для которых озвучка уже размечена (build/voice/timing.json), берутся оттуда,
    остальные оцениваются по числу слов.
    """
    narr = json.load(open(NARR))
    out = {}
    for k, lines in narr.items():
        t = 0.3 if k == "cold" else 0.6
        cues, words = [], []
        for line in lines:
            ws = line.split()
            d = len(ws) * 0.36 + 0.2
            for i, w in enumerate(ws):
                words.append((w, t + i * d / len(ws), t + (i + 1) * d / len(ws)))
            cues.append((t, t + d))
            t += d + 0.35
        out[k] = {"cues": cues, "words": words}
    if os.path.exists(TIMING):
        data = json.load(open(TIMING))
        for k, v in data["segments"].items():
            out[k] = {"cues": [(l["start"], l["end"]) for l in v["lines"]],
                      "words": [tuple(w) for l in v["lines"] for w in l["words"]]}
    return out
