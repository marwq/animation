"""Базовый персонаж в стиле рисованных Minecraft-анимаций (референс — канал Kopee).

Пропорции Minecraft: голова 8×8×8, тело 8×12×4, руки и ноги 4×12×4, рост 32 единицы
(1 единица = 1 пиксель скина). Лицо нарисовано: белые прямоугольные глаза со зрачком у
переносицы, прямые брови, короткий рот. Цвета сняты с кадров референса.

Девушку, зомби и других героев рисуем из этой же модели: меняем цвета и дорисовываем
волосы и детали.
"""
from blocky import OUT, Box, line, path, rect

NAME = 'steve'
TITLE = 'Стив — базовый персонаж'

SKIN = '#edb178'
HAIR = '#784100'
SHIRT = '#45cee8'
PANTS = '#4f2f7d'
SHOES = '#929292'
EYE = '#fdfdfd'
PALETTE = (('Кожа', SKIN), ('Волосы', HAIR), ('Футболка', SHIRT), ('Штаны', PANTS),
           ('Обувь', SHOES), ('Белки глаз', EYE), ('Контур', OUT))
# тень боковых граней: кожа и футболка светлее, волосы и штаны темнее — как в референсе
SHADE_LIGHT = 0.23
SHADE_DARK = 0.38

# направляющие (y модели): земля, пояс, плечи, глаза, макушка
GUIDES = (0, 12, 24, 24 + 8 - 3.7, 32)

FEATURE = 3.4    # линии лица, px
BROW = 5.6

# ------------------------------------------------------------------ голова 8×8
FRONT_HAIR = ('M0 0 H8 V2.0 Q7.65 2.15 7.35 1.75 Q6.3 1.45 5.0 1.6 Q3.6 1.75 2.4 1.55 '
              'Q1.5 1.42 1.2 1.95 Q1.0 2.6 0.5 2.7 L0 2.7 Z')
SIDE_HAIR = ('M0 0 H8 V4.8 Q7.4 5.05 7.0 4.45 Q6.6 3.8 6.0 3.9 Q5.35 4.0 5.2 3.3 '
             'Q5.0 2.4 4.2 2.3 Q3.0 2.1 1.8 2.0 Q1.0 1.95 0.75 2.4 L0.6 2.7 L0 2.7 Z')
BACK_HAIR = ('M0 0 H8 V4.8 Q7.2 5.3 6.4 4.9 Q5.4 4.45 4.6 5.0 Q3.8 5.45 3.0 4.9 '
             'Q2.0 4.45 1.4 5.0 Q0.7 5.4 0 4.8 Z')


def face():
    """Спокойное лицо на передней грани головы."""
    out = []
    for x0, px in ((1.05, 2.05), (5.05, 5.05)):          # глаз слева и справа от зрителя;
        out.append(rect(x0, 3.1, 1.9, 1.12, EYE))          # зрачок — у переносицы
        out.append(rect(px, 3.1, 0.9, 1.12, OUT))
        out.append(rect(px + 0.52, 3.24, 0.22, 0.22, EYE))  # блик
        out.append(rect(x0, 3.1, 1.9, 1.12, 'none', stroke=OUT, sw=FEATURE))
    out.append(path('M1.0 2.68 Q2.0 2.5 2.98 2.6', sw=BROW))
    out.append(path('M5.02 2.6 Q6.0 2.5 7.0 2.68', sw=BROW))
    out.append(path('M3.35 5.75 Q4.0 5.85 4.65 5.7', sw=FEATURE))
    return out


# ------------------------------------------------------------------ тело
# открытая шея на футболке: ступенчатый край, как у скина Стива
NECK = ('M1.6 0 H6.4 L6.3 0.7 L5.6 0.75 L5.5 1.3 L4.6 1.35 L4.45 1.9 L3.55 1.88 '
        'L3.45 1.3 L2.5 1.3 L2.4 0.72 L1.7 0.7 Z')


def sleeve(ul, vl):
    return [rect(0, 0, ul, 4.2, SHIRT), line([(0, 4.2), (ul, 4.2)])]


def shoe(ul, vl):
    k = ul / 4
    d = (f'M0 10.5 Q{0.8 * k} 10.2 {1.4 * k} 10.6 Q{2.2 * k} 11.0 {2.8 * k} 10.5 '
         f'Q{3.4 * k} 10.1 {ul} 10.4 V12 H0 Z')
    return [path(d, SHOES)]


def boxes(pose='stand'):
    head = Box('head', (8, 8, 8), (-4, 24, -4), {'default': SKIN, 'top': HAIR},
               {'front': [path(FRONT_HAIR, HAIR)] + face(),
                'side': [path(SIDE_HAIR, HAIR)],
                'back': [path(BACK_HAIR, HAIR)]},
               shade=SHADE_LIGHT)
    body = Box('body', (8, 12, 4), (-4, 12, -2), SHIRT,
               {'front': [path(NECK, SKIN)]}, shade=SHADE_LIGHT)
    arm_r = Box('arm-right', (4, 12, 4), (-8, 12, -2), {'default': SKIN, 'top': SHIRT},
                {'around': sleeve}, pivot=(-6, 23.6, 0), shade=SHADE_LIGHT)
    arm_l = Box('arm-left', (4, 12, 4), (4, 12, -2), {'default': SKIN, 'top': SHIRT},
                {'around': sleeve}, pivot=(6, 23.6, 0), shade=SHADE_LIGHT)
    leg_r = Box('leg-right', (4, 12, 4), (-4, 0, -2), {'default': PANTS, 'bottom': SHOES},
                {'around': shoe}, pivot=(-2, 11.8, 0), shade=SHADE_DARK)
    leg_l = Box('leg-left', (4, 12, 4), (0, 0, -2), {'default': PANTS, 'bottom': SHOES},
                {'around': shoe}, pivot=(2, 11.8, 0), shade=SHADE_DARK)
    return [leg_r, leg_l, body, arm_r, arm_l, head]
