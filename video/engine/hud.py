"""Интерфейс поверх сцены: шапка дела, счётчик правил, таймкод, субтитры, карточка правила."""
import math

import skia

from .core import (BG, DIM, FPS, GREY, H, RED, SOFT, W, WHITE, blink, clamp, color, draw_text, ease_in,
                   ease_out, font, hash01, lerp, out_back, paint, prog, rrect, text_width, xf)

NUMBERS = ["ONE", "TWO", "THREE", "FOUR", "FIVE", "SIX", "SEVEN"]


def hud(c, t, rule, file_no, agency, a=1.0, done=0):
    """rule — текущее правило (0 — ещё не начались); done — сколько уже пройдено."""
    if a <= 0:
        return
    f = font(17, "regular")
    gp = paint(GREY, 0.9 * a)
    draw_text(c, f"FILE {file_no}  //  {agency}", 60, 62, f, gp, tracking=2.4)
    # таймкод
    fr = int(t * FPS)
    tc = f"{fr // (3600 * FPS):02d}:{fr // (60 * FPS) % 60:02d}:{fr // FPS % 60:02d}:{fr % FPS:02d}"
    draw_text(c, tc, W - 60, 62, f, gp, "right", tracking=2.4)
    c.drawCircle(W - 60 - text_width(tc, f, 2.4) - 18, 56, 5, paint(RED, a * (0.35 + 0.65 * blink(t, 1.0))))
    # счётчик правил
    n, box, gap = 7, 22, 8
    x0 = W / 2 - (n * box + (n - 1) * gap) / 2
    fn = font(12, "bold")
    for i in range(n):
        x = x0 + i * (box + gap)
        r = rrect(x, 44, box, box, 4)
        num = str(i + 1)
        if i + 1 == rule:
            c.drawRRect(r, paint(RED if i == 6 else WHITE, a))
            draw_text(c, num, x + box / 2, 59.5, fn, paint(BG, a), "center")
        elif i + 1 <= done:
            c.drawRRect(r, paint(DIM, a))
            draw_text(c, num, x + box / 2, 59.5, fn, paint(SOFT, a), "center")
        else:
            c.drawRRect(r, paint(RED if i == 6 else GREY, 0.7 * a, stroke=1.5))
            draw_text(c, num, x + box / 2, 59.5, fn, paint(RED if i == 6 else GREY, 0.8 * a), "center")
    # уголки видоискателя
    L, m = 42, 34
    pc = paint(SOFT, 0.28 * a, stroke=2, cap="butt")
    for (x, y, dx, dy) in ((m, m + 52, 1, 1), (W - m, m + 52, -1, 1), (m, H - m, 1, -1), (W - m, H - m, -1, -1)):
        c.drawLine(x, y, x + dx * L, y, pc)
        c.drawLine(x, y, x, y + dy * L, pc)


class Captions:
    """Субтитры: слова появляются в такт голосу, акценты — красным."""

    SIZE = 46
    MAXW = 1480
    LINE_H = 62
    BASE = H - 112  # базовая линия последней строки

    def __init__(self, timeline, hidden=()):
        self.f = font(self.SIZE, "bold")
        self.pages = []
        for L in timeline["lines"]:
            if L["id"] in hidden:
                continue
            words = [dict(w, up=w["w"].upper()) for w in L["words"]]
            sp = self.f.measureText(" ")
            lines, cur, cw = [], [], 0.0
            for w in words:
                ww = text_width(w["up"], self.f, 1.5)
                if cur and cw + sp + ww > self.MAXW:
                    lines.append(cur)
                    cur, cw = [], 0.0
                cur.append(w)
                cw += (sp if len(cur) > 1 else 0) + ww
            if cur:
                lines.append(cur)
            for k in range(0, len(lines), 2):
                chunk = lines[k:k + 2]
                self.pages.append({"lines": chunk, "t0": chunk[0][0]["t0"], "line": L["id"],
                                   "lend": L["end"]})
        for i, p in enumerate(self.pages):
            nxt = self.pages[i + 1]["t0"] if i + 1 < len(self.pages) else p["lend"] + 3
            # страница держится до следующей, но не дольше 1.6 с после конца реплики
            p["t1"] = min(nxt, max(p["lend"], p["lines"][-1][-1]["t1"]) + 1.6)
            if i + 1 < len(self.pages) and self.pages[i + 1]["line"] == p["line"]:
                p["t1"] = nxt

    def draw(self, c, t, a=1.0):
        page = None
        for p in self.pages:
            if p["t0"] - 0.12 <= t < p["t1"]:
                page = p
        if page is None or a <= 0:
            return
        out = 1 - ease_in(prog(t, page["t1"] - 0.18, 0.18))
        sp = self.f.measureText(" ")
        nl = len(page["lines"])
        for li, line in enumerate(page["lines"]):
            widths = [text_width(w["up"], self.f, 1.5) for w in line]
            total = sum(widths) + sp * (len(line) - 1)
            x = W / 2 - total / 2
            y = self.BASE - (nl - 1 - li) * self.LINE_H
            for w, ww in zip(line, widths):
                k = ease_out(prog(t, w["t0"] - 0.06, 0.16))
                if k > 0:
                    al = a * k * out
                    yy = y + (1 - k) * 10
                    col = RED if w["e"] else WHITE
                    if w["e"]:
                        draw_text(c, w["up"], x, yy, self.f, paint(RED, 0.55 * al, blur=9), tracking=1.5)
                    # тонкая тень для читаемости поверх рисунка
                    draw_text(c, w["up"], x, yy + 3, self.f, paint(BG, 0.8 * al, blur=4), tracking=1.5)
                    draw_text(c, w["up"], x, yy, self.f, paint(col, al), tracking=1.5)
                x += ww + sp


def rule_card(c, t, t0, n, subtitle, done_t=None):
    """Карточка правила на чёрном фоне. t0 — начало."""
    lt = t - t0
    f_big = font(150, "bold")
    f_num = font(150, "bold")
    f_sub = font(30, "bold")
    f_small = font(16, "regular")
    red7 = n == 7
    # «RULE» и номер в рамке
    k = ease_out(prog(lt, 0.0, 0.35))
    word = "RULE"
    ww = text_width(word, f_big, 6)
    box = 170
    total = ww + 36 + box
    x0 = W / 2 - total / 2
    y = 520
    with xf(c, 0, (1 - k) * 30):
        draw_text(c, word, x0, y, f_big, paint(WHITE, k), tracking=6)
        bx = x0 + ww + 36
        kb = out_back(prog(lt, 0.12, 0.4))
        if kb > 0:
            with xf(c, bx + box / 2, y - 55, s=kb):
                c.drawRRect(rrect(-box / 2, -box / 2 - 2, box, box + 4, 18), paint(RED if red7 else WHITE))
                draw_text(c, str(n), 0, 53, f_num, paint(BG), "center")
    # красная линия
    lw = 760 * ease_out(prog(lt, 0.3, 0.5))
    c.drawLine(W / 2 - lw / 2, 590, W / 2 + lw / 2, 590, paint(RED, 1, stroke=4, cap="butt"))
    c.drawLine(W / 2 - lw / 2, 590, W / 2 + lw / 2, 590, paint(RED, 0.6, stroke=10, blur=8))
    # подзаголовок печатается
    if subtitle:
        nch = int(clamp((lt - 0.55) / 0.04, 0, len(subtitle)))
        s = subtitle[:nch]
        draw_text(c, s, W / 2, 650, f_sub, paint(WHITE), "center", tracking=10)
        if nch < len(subtitle) and lt > 0.55:
            tw = text_width(subtitle, f_sub, 10)
            cx = W / 2 - tw / 2 + text_width(s, f_sub, 10) + 8
            c.drawRect(skia.Rect.MakeXYWH(cx, 622, 16, 32), paint(RED))
    else:
        # правило 7: подзаголовок вымаран
        kk = ease_out(prog(lt, 0.55, 0.5))
        c.drawRect(skia.Rect.MakeXYWH(W / 2 - 230 * kk, 620, 460 * kk, 40), paint(WHITE))
    # 7 ячеек прогресса
    for i in range(7):
        x = W / 2 - 7 * 34 / 2 + i * 34 + 3
        r = rrect(x, 700, 28, 28, 5)
        ki = ease_out(prog(lt, 0.5 + i * 0.05, 0.2))
        if i + 1 < n:
            c.drawRRect(r, paint(DIM, ki))
        elif i + 1 == n:
            c.drawRRect(r, paint(RED if red7 else WHITE, ki * (0.6 + 0.4 * blink(lt, 2.5))))
        else:
            c.drawRRect(r, paint(GREY, 0.6 * ki, stroke=1.5))
    draw_text(c, f"DIRECTIVE 017-{n}  •  COMPLIANCE IS MANDATORY", W / 2, 790, f_small,
              paint(GREY, ease_out(prog(lt, 0.8, 0.4))), "center", tracking=4)


def title_card(c, t, t0, title_top, title_main, file_no, agency, logo_fn):
    lt = t - t0
    logo_fn(c, W / 2, 330, 250 * out_back(prog(lt, 0.0, 0.6)), lt)
    f1 = font(44, "bold")
    f2 = font(86, "bold")
    f3 = font(18, "regular")
    k1 = ease_out(prog(lt, 0.35, 0.4))
    draw_text(c, title_top, W / 2, 560 + (1 - k1) * 20, f1, paint(WHITE, k1), "center", tracking=3)
    k2 = ease_out(prog(lt, 0.7, 0.35))
    with xf(c, W / 2, 680, s=lerp(1.25, 1.0, k2)):
        draw_text(c, title_main, 0, 0, f2, paint(RED, 0.5 * k2, blur=14), "center", tracking=6)
        draw_text(c, title_main, 0, 0, f2, paint(RED, k2), "center", tracking=6)
    k3 = ease_out(prog(lt, 1.1, 0.4))
    draw_text(c, f"FILE {file_no}  //  {agency}  //  FOR PUBLIC DISTRIBUTION", W / 2, 760, f3,
              paint(GREY, k3), "center", tracking=4)
