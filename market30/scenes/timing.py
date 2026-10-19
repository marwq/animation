"""Тайминг: длительность сегмента = вступление + реплики с паузами + хвост (не фиксированная, как у конкурента).

build/voice/timing.json — после разметки озвучки; без неё — оценка по числу слов."""
import json
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TIMING = os.path.join(ROOT, "build", "voice", "timing.json")
NARR = os.path.join(ROOT, "script", "narration.json")

ORDER = ["d00", "d01", "d02", "d03", "d05", "d07", "d09", "d11", "d12", "d14", "d16", "d18", "d20", "d22", "d25",
         "d28", "d30"]
START = {"d00": 0.9}            # тишина перед первой репликой
GAP = 0.5                       # пауза между репликами
PAUSE = {("d00", 0): 0.5, ("d00", 3): 0.9, ("d00", 4): 0.5, ("d00", 5): 1.2, ("d00", 6): 1.5,
         ("d01", 0): 0.3, ("d01", 1): 0.6, ("d01", 4): 0.3,
         ("d02", 0): 0.3, ("d02", 2): 0.3, ("d02", 4): 0.2,
         ("d03", 0): 0.3, ("d03", 1): 0.3, ("d03", 2): 0.4, ("d03", 3): 0.4, ("d03", 4): 0.3,
         ("d05", 0): 0.3, ("d05", 2): 0.3, ("d05", 3): 0.2, ("d05", 4): 0.3,
         ("d07", 0): 0.3, ("d07", 1): 0.6, ("d07", 2): 0.9, ("d07", 3): 0.4,
         ("d09", 0): 0.4, ("d09", 1): 0.9, ("d09", 2): 0.3, ("d09", 3): 0.4}          # доп. пауза после реплики
TAIL = {"d00": 3.6, "d01": 1.4, "d02": 4.0, "d03": 1.5, "d05": 1.6, "d07": 1.6, "d09": 1.8}   # после последней реплики (карточки, затемнение)


def layout(key, durs):
    """Длительности реплик → [(начало, конец)], длительность сегмента."""
    t = START.get(key, 0.45)
    out = []
    for i, d in enumerate(durs):
        out.append((round(t, 3), round(t + d, 3)))
        t += d + GAP + PAUSE.get((key, i), 0.0)
    end = out[-1][1] if out else t
    return out, round(end + TAIL.get(key, 1.0), 3)


def load():
    """→ {ключ: {"cues": [(начало, конец)], "words": [(слово, начало, конец)], "dur": сек}}"""
    narr = json.load(open(NARR))
    out = {}
    for k, lines in narr.items():
        durs = [len(l.split()) * 0.36 + 0.2 for l in lines]
        cues, dur = layout(k, durs)
        words = []
        for (a, b), line in zip(cues, lines):
            ws = line.split()
            for i, w in enumerate(ws):
                words.append((w, a + i * (b - a) / len(ws), a + (i + 1) * (b - a) / len(ws)))
        out[k] = {"cues": cues, "words": words, "dur": dur}
    if os.path.exists(TIMING):
        data = json.load(open(TIMING))
        for k, v in data["segments"].items():
            out[k] = {"cues": [(l["start"], l["end"]) for l in v["lines"]],
                      "words": [tuple(w) for l in v["lines"] for w in l["words"]], "dur": v["dur"]}
    return out
