"""Надписи поверх кадра: счётчик дней, субтитры, заголовок."""
import math
import cairo
from .core import W, H, clamp, ease_out, ease_out_back, hexrgb, TAU, smooth
from . import draw as D

CREAM = hexrgb("#f7eedb")
DARK = hexrgb("#211a17")

DAY_SIZE = 66
DAY_X, DAY_Y = 58, 112


def _outlined(ctx, s, x, y, size, family, fill=CREAM, lw=9, alpha=1.0, bold=False, align="left"):
    # тень
    D.text(ctx, s, x + 4, y + 5, size, family, DARK, align, bold, alpha * 0.45, DARK, lw)
    D.text(ctx, s, x, y, size, family, fill, align, bold, alpha, DARK, lw)


def sun_icon(ctx, x, y, r, alpha=1.0):
    D.col(ctx, DARK, alpha)
    ctx.set_line_width(r * 0.5)
    ctx.set_line_cap(cairo.LINE_CAP_ROUND)
    for k in range(8):
        a = k * TAU / 8
        ctx.move_to(x + math.cos(a) * r * 1.35, y + math.sin(a) * r * 1.35)
        ctx.line_to(x + math.cos(a) * r * 1.85, y + math.sin(a) * r * 1.85)
    ctx.stroke()
    c = hexrgb("#f2b84b")
    D.col(ctx, c, alpha)
    ctx.set_line_width(r * 0.24)
    for k in range(8):
        a = k * TAU / 8
        ctx.move_to(x + math.cos(a) * r * 1.38, y + math.sin(a) * r * 1.38)
        ctx.line_to(x + math.cos(a) * r * 1.8, y + math.sin(a) * r * 1.8)
    ctx.stroke()
    D.circle(ctx, x, y, r, c, DARK, r * 0.3, alpha)


def moon_icon(ctx, x, y, r, alpha=1.0):
    ctx.save()
    ctx.push_group()
    D.circle(ctx, x, y, r, hexrgb("#e9e4cf"), DARK, r * 0.3)
    ctx.set_operator(cairo.OPERATOR_CLEAR)
    ctx.arc(x + r * 0.55, y - r * 0.35, r * 0.82, 0, TAU)
    ctx.fill()
    ctx.set_operator(cairo.OPERATOR_OVER)
    ctx.arc(x + r * 0.55, y - r * 0.35, r * 0.82, math.pi * 0.62, math.pi * 1.12)
    D.col(ctx, DARK)
    ctx.set_line_width(r * 0.3)
    ctx.stroke()
    ctx.pop_group_to_source()
    ctx.paint_with_alpha(alpha)
    ctx.restore()


ICON = {"day": "sun", "morning": "sun", "dawn": "sun", "dusk": "moon", "night": "moon", "deepnight": "moon",
        "storm": "moon", "overcast": "sun", "golden": "sun"}


def day_counter(ctx, day, t_seg, tod="day", tod_prev=None, t_tod=99.0, prev_day=None, alpha=1.0):
    """«DAY N» слева сверху. В первые 0.5 с сегмента номер перелистывается."""
    if day is None or alpha <= 0:
        return
    label = "DAY"
    _outlined(ctx, label, DAY_X, DAY_Y, DAY_SIZE, D.FONT_DAY, bold=True, alpha=alpha)
    lw = D.text_width(ctx, label + " ", DAY_SIZE, D.FONT_DAY, True)
    nx = DAY_X + lw
    k = clamp(t_seg / 0.5) if prev_day is not None and prev_day != day else 1.0
    ctx.save()
    ctx.rectangle(nx - 10, DAY_Y - DAY_SIZE - 12, 220, DAY_SIZE + 36)
    ctx.clip()
    if k < 1:
        e = ease_out(k)
        _outlined(ctx, str(prev_day), nx, DAY_Y - e * 80, DAY_SIZE, D.FONT_DAY, bold=True, alpha=alpha * (1 - e))
        _outlined(ctx, str(day), nx, DAY_Y + (1 - e) * 80, DAY_SIZE, D.FONT_DAY, bold=True, alpha=alpha * e)
    else:
        _outlined(ctx, str(day), nx, DAY_Y, DAY_SIZE, D.FONT_DAY, bold=True, alpha=alpha)
    ctx.restore()
    nw = D.text_width(ctx, str(day), DAY_SIZE, D.FONT_DAY, True)
    ix, iy, r = nx + nw + 56, DAY_Y - DAY_SIZE * 0.36, 19
    kind = ICON.get(tod, "sun")
    a2 = clamp(t_tod / 0.5) if tod_prev and ICON.get(tod_prev) != kind else 1.0
    if a2 < 1:
        other = ICON.get(tod_prev, "sun")
        (sun_icon if other == "sun" else moon_icon)(ctx, ix, iy - a2 * 20, r, alpha * (1 - a2))
    (sun_icon if kind == "sun" else moon_icon)(ctx, ix, iy + (1 - a2) * 20, r, alpha * a2)


# --- субтитры ---------------------------------------------------------------

CAP_SIZE = 82
CAP_Y = 968


def chunk_words(words, max_words=3, max_chars=17):
    """words: [(слово, начало, конец)] → [(текст, начало, конец)]."""
    chunks, cur = [], []
    for w in words:
        cur.append(w)
        txt = " ".join(x[0] for x in cur)
        end_punct = w[0][-1:] in ".,!?:;"
        if len(cur) >= max_words or len(txt) >= max_chars or end_punct:
            chunks.append(cur)
            cur = []
    if cur:
        chunks.append(cur)
    out = []
    for i, c in enumerate(chunks):
        st = c[0][1]
        en = c[-1][2] + 0.25
        if i + 1 < len(chunks):
            en = min(max(en, c[-1][2]), chunks[i + 1][0][1])
        txt = " ".join(x[0] for x in c).strip(" ,;:")
        out.append((txt, st, en))
    return out


def caption(ctx, chunks, t, alpha=1.0, y=CAP_Y):
    for txt, st, en in chunks:
        if st <= t < en:
            k = clamp((t - st) / 0.12)
            sc = 1.12 - 0.12 * ease_out(k)
            a = alpha * clamp((en - t) / 0.08)
            ctx.save()
            ctx.translate(W / 2, y)
            ctx.scale(sc, sc)
            s = txt.upper()
            D.text(ctx, s, 3, 5, CAP_SIZE, D.FONT_HAND, DARK, "center", False, a * 0.5, DARK, 12)
            D.text(ctx, s, 0, 0, CAP_SIZE, D.FONT_HAND, hexrgb("#fffaf0"), "center", False, a, DARK, 11)
            ctx.restore()
            return


# --- заголовок ----------------------------------------------------------------

def title_card(ctx, t, alpha=1.0):
    """Заголовок ролика (t — время от появления)."""
    D.col(ctx, DARK, alpha * 0.82)
    ctx.paint()
    k1 = ease_out_back(clamp(t / 0.35))
    k2 = ease_out_back(clamp((t - 0.25) / 0.35))
    k3 = ease_out_back(clamp((t - 0.5) / 0.35))
    ctx.save()
    sh = max(0, 1 - t / 0.4) * 10
    ctx.translate(math.sin(t * 90) * sh, 0)
    D.text(ctx, "ZOMBIE OUTBREAK", W / 2, 390, 54 * k1, D.FONT_TITLE, hexrgb("#d9483b"), "center",
           alpha=alpha, tracking=6)
    _c(ctx, "30 DAYS TRAPPED ON", 520, 100 * k2, alpha)
    _c(ctx, "A CRUISE SHIP", 650, 130 * k3, alpha)
    ctx.restore()


def _c(ctx, s, y, size, alpha):
    if size < 2:
        return
    D.text(ctx, s, W / 2 + 6, y + 8, size, D.FONT_TITLE, DARK, "center", False, alpha * 0.5, DARK, 14)
    D.text(ctx, s, W / 2, y, size, D.FONT_TITLE, CREAM, "center", False, alpha, DARK, 12)
