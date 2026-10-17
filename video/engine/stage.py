"""Сцены на общей шкале времени: привязка к репликам и словам, переходы, звуковые метки."""
import re

from .core import BG, CX, CY, H, W, clamp, ease_io, hash01, prog


def _norm(w):
    return re.sub(r"[^a-z0-9]", "", w.lower())


class Scene:
    def __init__(self, t0, builder, name, trans, push, hud, captions):
        self.t0, self.t1 = t0, None
        self.builder, self.name = builder, name
        self.trans, self.push, self.hud, self.captions = trans, push, hud, captions
        self.draw = None
        self.cam = None  # функция t -> (масштаб, cx, cy) вместо стандартного наезда


class Stage:
    def __init__(self, timeline):
        self.tl = timeline
        self.lines = {L["id"]: L for L in timeline["lines"]}
        self.duration = timeline["duration"]
        self.scenes, self.cues, self.glitches, self.shakes, self.flashes = [], [], [], [], []

    # --- время ---
    def at(self, lid, word=None, nth=0):
        """Начало реплики или слова в ней (по тексту или по номеру)."""
        L = self.lines[lid]
        if word is None:
            return L["start"]
        if isinstance(word, int):
            return L["words"][word]["t0"]
        k = 0
        for w in L["words"]:
            if _norm(w["w"]) == _norm(word):
                if k == nth:
                    return w["t0"]
                k += 1
        raise KeyError(f"{lid}: нет слова {word!r}")

    def wend(self, lid, word, nth=0):
        L = self.lines[lid]
        k = 0
        for w in L["words"]:
            if _norm(w["w"]) == _norm(word):
                if k == nth:
                    return w["t1"]
                k += 1
        raise KeyError(word)

    def end(self, lid):
        return self.lines[lid]["end"]

    # --- события ---
    def cue(self, t, kind, **kw):
        self.cues.append(dict(t=float(t), kind=kind, **kw))

    def glitch(self, t, dur=0.13, amp=0.55, sound=True):
        self.glitches.append((t, dur, amp))
        if sound:
            self.cue(t, "glitch", amp=amp, dur=dur)

    def shake(self, t, amp=12.0, dur=0.35):
        self.shakes.append((t, dur, amp))

    def flash(self, t, amp=0.35, dur=0.18, color=(255, 255, 255)):
        self.flashes.append((t, dur, amp, color))

    # --- сцены ---
    def add(self, t0, builder, name=None, trans="glitch", push=0.035, hud=True, captions=True):
        sc = Scene(t0, builder, name or builder.__name__, trans, push, hud, captions)
        self.scenes.append(sc)
        return sc

    def finalize(self):
        self.scenes.sort(key=lambda s: s.t0)
        for a, b in zip(self.scenes, self.scenes[1:]):
            a.t1 = b.t0
        self.scenes[-1].t1 = self.duration
        for sc in self.scenes:
            if sc.trans == "glitch":
                self.glitch(sc.t0, 0.1, 0.45)
            elif sc.trans == "hard":
                self.glitch(sc.t0, 0.2, 0.9)
                self.shake(sc.t0, 14, 0.3)
        for sc in self.scenes:
            sc.draw = sc.builder(self, sc)

    def scene_at(self, t):
        for sc in self.scenes:
            if sc.t0 <= t < sc.t1:
                return sc
        return self.scenes[-1]

    # --- состояние кадра ---
    def glitch_amt(self, t):
        g = 0.0
        for t0, d, a in self.glitches:
            if t0 <= t < t0 + d:
                k = 1 - (t - t0) / d
                g = max(g, a * (0.5 + 0.5 * k))
        return g

    def shake_xy(self, t):
        x = y = 0.0
        for t0, d, a in self.shakes:
            if t0 <= t < t0 + d:
                k = (1 - (t - t0) / d) ** 2
                x += (hash01(t * 60, 1) - 0.5) * 2 * a * k
                y += (hash01(t * 60, 2) - 0.5) * 2 * a * k
        return x, y

    def flash_amt(self, t):
        f = 0.0
        for t0, d, a, _ in self.flashes:
            if t0 <= t < t0 + d:
                f = max(f, a * (1 - (t - t0) / d))
        return f

    def camera(self, sc, t):
        if sc.cam:
            return sc.cam(t)
        k = ease_io(prog(t, sc.t0, max(0.5, sc.t1 - sc.t0)))
        return 1.0 + sc.push * k, CX, CY

    def scene_alpha(self, sc, t):
        if sc.trans == "fade":
            return clamp((t - sc.t0) / 0.35)
        return 1.0
