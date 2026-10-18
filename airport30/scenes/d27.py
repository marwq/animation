"""День 27: записываешь объявление: «Дамы и господа, это последняя посадка на рейс 30 куда угодно, только
не сюда. Пройдите к выходу A1». Таймер на 6:00 тридцатого дня. Записка бабушке Джун — на скотч внутри
двери Рози. На всякий случай."""
from scenes.kit import *
from scenes.shared import *
from scenes.d11 import hangar_bg, ROSIE_X

GX = TM.gate_xs("A")[0]


def shot_record(ctx, t, S):
    d = S.cue(1) - 0.1
    cam = Cam(GX + 120, TM.FL - 250, Keys((0, 1.8), (d, 2.1)))
    term_back(ctx, t, cam, "night", 1.0, "A")
    with layer(ctx, cam, t):
        p = R.stand("side", t, 1)
        p.update(face="determined", h1=(0.62, -3.0), hturn=0.7, lean=0.1)
        J = DANNY_JACKET.draw(ctx, GX + 220, TM.FL, 115, -1, p)
        D.circle(ctx, GX + 92, TM.FL - 256, 14, hexrgb("#ff4a3a") if (t * 2) % 1 < 0.6 else hexrgb("#5a1a1a"),
                 D.INK, 3)
    D.circle(ctx, 120, 120, 22, hexrgb("#ff4a3a") if (t * 2) % 1 < 0.6 else hexrgb("#5a1a1a"), None, 0)
    D.text(ctx, "REC", 156, 136, 44, D.FONT_TITLE, hexrgb("#fff6d8"), "left")


def shot_announce(ctx, t, S):
    d = S.cue(2) - S.cue(1)
    D.vgrad(ctx, 0, 0, W, H, [(0, "#1c3f7c"), (1, "#0e1e40")])
    # бегущая строка как на табло
    txt = "LADIES AND GENTLEMEN · FINAL BOARDING CALL · FLIGHT 30 · TO ANYWHERE BUT HERE · GATE A1 ·"
    D.rrect(ctx, 80, 380, W - 160, 300, 30, hexrgb("#15181f"), D.INK, 8)
    ctx.save()
    ctx.rectangle(110, 400, W - 220, 260)
    ctx.clip()
    x = W - t * 420
    D.text(ctx, txt, x, 570, 120, D.FONT_TITLE, hexrgb("#ffd23a"), "left")
    ctx.restore()
    for i, (lab, c) in enumerate((("FLIGHT 30", "#4cff8a"), ("ANYWHERE BUT HERE", "#fff6d8"), ("GATE A1", "#ff9a3c"))):
        t0 = 0.4 + i * d * 0.25
        pop_text(ctx, lab, 380 + i * 580, 260, t, t0, 60, c, dur=d, shake=False)
    speakers(ctx, t, [(200, 860), (W - 200, 860)], 1.0)


def shot_timer(ctx, t, S):
    d = S.cue(3) - S.cue(2)
    D.vgrad(ctx, 0, 0, W, H, [(0, "#2a2448"), (1, "#141030")])
    k = ease_out_back(clamp(t / 0.35))
    ctx.save()
    ctx.translate(W / 2, H / 2)
    ctx.scale(k, k)
    D.rrect(ctx, -520, -260, 1040, 520, 50, hexrgb("#3a3f4a"), D.INK, 10)
    D.rrect(ctx, -440, -180, 880, 260, 20, hexrgb("#0e1410"), D.INK, 6)
    D.text(ctx, "06:00", 0, 40, 220, D.FONT_TITLE, hexrgb("#ff4a3a"))
    D.text(ctx, "DAY 30", 0, 180, 70, D.FONT_TITLE, hexrgb("#fff6d8"))
    D.circle(ctx, 420, 180, 30, hexrgb("#4cff8a") if t > 0.8 else hexrgb("#2b2f3a"), D.INK, 5)
    ctx.restore()
    if t > 0.8:
        pop_text(ctx, "SET.", W / 2 + 480, 220, t, 0.8, 100, "#4cff8a", dur=d)


def shot_note(ctx, t, S):
    d = S.dur - S.cue(3)
    T_TAPE = max(1.8, S.cue(3, True) - S.cue(3) - 2.4)
    if t < T_TAPE:
        D.vgrad(ctx, 0, 0, W, H, [(0, "#2a2448"), (1, "#141030")])
        ctx.save()
        ctx.translate(W / 2, H / 2 - 20)
        ctx.rotate(-0.03)
        D.rect(ctx, -460, -330, 920, 660, hexrgb("#fbf3dc"), D.INK, 6, wob=0)
        lines = ["Dear Grandma June,", "If you're reading this,", "I tried. I flew.", "Eat a vegetable.", "— Danny"]
        for i, ln in enumerate(lines):
            step = (T_TAPE - 0.2) / len(lines)
            n = int(clamp((t - i * step) / step) * len(ln))
            D.text(ctx, ln[:n], -400, -200 + i * 110, 70, D.FONT_HAND, hexrgb("#2a3a7a"), "left")
        ctx.restore()
        return
    tt = t - T_TAPE
    cam = Cam(ROSIE_X + 1.1 * 140, RM.FL + 40 - 1.1 * 200, 2.6)
    hangar_bg(ctx, tt, cam, "night", 0.0)
    with layer(ctx, cam, tt):
        PL.rosie(ctx, ROSIE_X, RM.FL + 40, 1.1, 1, "night", door=0.0)
        x0, y0 = ROSIE_X + 1.1 * 90, RM.FL + 40 - 1.1 * 215
        ctx.save()
        ctx.translate(x0, y0)
        ctx.rotate(0.06)
        D.rect(ctx, -40, -30, 80, 60, hexrgb("#fbf3dc"), D.INK, 3, wob=0)
        D.text(ctx, "June", 0, 8, 22, D.FONT_HAND, hexrgb("#2a3a7a"))
        D.rect(ctx, -50, -36, 30, 10, hexrgb("#e8e0c0"), None, 0, wob=0, alpha=0.8)
        D.rect(ctx, 20, -36, 30, 10, hexrgb("#e8e0c0"), None, 0, wob=0, alpha=0.8)
        ctx.restore()
    fx.darkness(ctx, 0.4, [fx.Light(W / 2, H / 2, 500, power=0.6, glow_a=0.0)])
    pop_text(ctx, "JUST IN CASE.", W / 2, 230, tt, 1.2, 90, "#fff6d8", dur=d, shake=False)


def build(S):
    c = S.cue
    S.shots = [
        Shot(0, shot_record, "fade", 0.3),
        Shot(c(1) - 0.1, shot_announce, "fade", 0.25),
        Shot(c(2) - 0.1, shot_timer, "fade", 0.25),
        Shot(c(3) - 0.1, shot_note, "fade", 0.3),
    ]
    S.tods = [(0, "night")]
    S.sfx += [(c(1), "pa_chime", 0.9), (c(2) + 0.8, "ding", 0.9), (c(3) + 0.2, "pencil", 0.8)]
    S.music = [(0, "plan", 0.7), (c(3), "sad", 0.9)]
