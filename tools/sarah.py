"""Сара: светлое каре с чёлкой набок (пряди заправлены за уши), розовая майка
без рукавов, бусы с кулоном-зубом, румянец. Холст вида 600×1000, земля y=952 —
она немного ниже Элли: голова и тело ~94 % от Элли.

Группы <g id="вид-часть">; «left/right» — сторона самой героини, а не зрителя.
"""
from charlib import DET, LIMB, OUT, P, clip, fill_only, grouper, shade, shape

NAME = 'sarah'
TITLE = 'Сара'
W, H = 600, 1000
GROUND = 952
GUIDES = (146, 415, 581, 800, 952)   # макушка, глаза, подбородок, подол, земля

# ------------------------------------------------------------------ палитра
SKIN = '#f9d0b6'
SKIN_SH = '#eab092'
BLUSH = '#f4a9a3'
HAIR = '#dab57c'      # блонд
HAIR_SH = '#b68f58'
TOP = '#e3a0b5'       # розовая майка
TOP_SH = '#c47f96'
CORD = '#3a2e27'      # бусы: шнурок, тёмные и светлые бусины, зуб
BEAD_DK = '#5c4433'
BEAD_LT = '#d8c5a4'
TOOTH = '#f4efe4'

PALETTE = (('Кожа', SKIN), ('Тень кожи', SKIN_SH), ('Румянец', BLUSH), ('Волосы', HAIR),
           ('Тень волос', HAIR_SH), ('Майка', TOP), ('Тень майки', TOP_SH),
           ('Бусины', BEAD_DK), ('Бусины', BEAD_LT), ('Кулон', TOOTH), ('Контур', OUT))

# Голова спереди и сзади (симметричная), уши слева и справа от зрителя
HEAD_FB = ('M300 186 C386 186 452 233 464 318 C475 383 488 440 482 485 '
           'C475 548 399 581 300 581 C201 581 125 548 118 485 '
           'C112 440 125 383 136 318 C148 233 214 186 300 186 Z')
# ухо: открытый контур от щеки до щеки + заливка, заходящая на лицо,
# чтобы ухо лежало поверх заправленных волос
EAR_VL = 'M122 408 C100 392 69 413 74 449 C80 479 102 492 119 486'
EAR_VR = 'M478 408 C500 392 531 413 526 449 C520 479 498 492 481 486'
EAR_IN_VL = 'M103 429 C88 434 86 453 98 464'
EAR_IN_VR = 'M497 429 C512 434 514 453 502 464'
LEG_VL = 'M256 780 L256 950 L228 952'
LEG_VR = 'M344 780 L344 950 L372 952'
ARM_VL = 'M222 592 C198 634 178 708 182 800'
ARM_VR = 'M378 592 C402 634 422 708 418 800'
TOP_EDGE_SH = 'M392 610 C388 690 390 750 396 806 L430 806 L430 610 Z'
# каре: общий силуэт (спереди он за лицом, сзади — весь затылок)
BOB = ('M300 146 C412 146 494 212 504 312 C510 364 508 410 507 452 '
       'C506 496 512 532 508 558 C504 582 482 596 440 598 C400 600 350 600 300 600 '
       'C250 600 200 600 160 598 C118 596 96 582 92 558 C88 532 94 496 93 452 '
       'C92 410 90 364 96 312 C106 212 188 146 300 146 Z')


def ear(outline, inner, inner_color=OUT, attach_dx=12):
    """Ухо поверх лица и волос: заливка до линии крепления, контур без неё."""
    start, end = outline.split()[0][1:], outline.split()[-2:]
    sx, sy = float(start), float(outline.split()[1])
    ex, ey = float(end[0]), float(end[1])
    d = 1 if sx < 300 else -1
    fill_d = f'{outline} L{ex + d * attach_dx:g} {ey:g} L{sx + d * attach_dx:g} {sy:g} Z'
    return [fill_only(fill_d, SKIN), P(outline), P(inner, sw=DET, stroke=inner_color)]


def necklace(points, pendant):
    """Бусы: шнурок по точкам, бусины через одну тёмная/светлая, кулон-зуб."""
    d = 'M' + ' L'.join(f'{x} {y}' for x, y in points)
    items = [P(d, sw=3, stroke=CORD)]
    for i, (x, y) in enumerate(points):
        items.append(f'<circle cx="{x}" cy="{y}" r="5" fill="{BEAD_DK if i % 2 else BEAD_LT}" '
                     f'stroke="{OUT}" stroke-width="2"/>')
    px, py = pendant
    items.append(shape(f'M{px - 7} {py} L{px + 7} {py} L{px} {py + 18} Z', TOOTH, sw=3))
    return items


# ================================================================== СПЕРЕДИ
def front(pfx='front'):
    defs, body = [], []
    G = grouper(pfx)
    FACE = HEAD_FB

    # каре за головой: видно по бокам лица до линии подбородка
    defs.append(clip(f'{pfx}-bob-clip', BOB))
    body.append(G('hair-back',
                  fill_only(BOB, HAIR),
                  shade(f'{pfx}-bob-clip',
                        fill_only(FACE, HAIR_SH, extra='transform="translate(0 16)"'),
                        fill_only('M470 300 C500 400 506 500 480 620 L560 620 L560 300 Z', HAIR_SH)),
                  P(BOB),
                  P('M110 482 C108 510 110 536 118 562', sw=DET),
                  P('M490 482 C492 510 490 536 482 562', sw=DET)))

    body.append(G('leg-right', P(LEG_VL, sw=LIMB)))
    body.append(G('leg-left', P(LEG_VR, sw=LIMB)))
    body.append(G('arm-right', P(ARM_VL, sw=LIMB)))
    body.append(G('arm-left', P(ARM_VR, sw=LIMB)))

    body.append(G('neck', fill_only('M240 552 L360 552 L360 630 L240 630 Z', SKIN_SH)))

    # розовая майка без рукавов
    TOPD = ('M246 562 L224 564 C228 586 222 608 208 620 '
            'C205 680 202 740 200 796 C266 806 334 806 400 796 '
            'C398 740 395 680 392 620 C378 608 372 586 376 564 '
            'L354 562 C348 596 330 610 300 610 C270 610 252 596 246 562 Z')
    defs.append(clip(f'{pfx}-top-clip', TOPD))
    body.append(G('top',
                  fill_only(TOPD, TOP),
                  shade(f'{pfx}-top-clip',
                        fill_only(FACE, TOP_SH, extra='transform="translate(0 20)"'),
                        fill_only(TOP_EDGE_SH, TOP_SH)),
                  P(TOPD)))

    # бусы (верх прячется под подбородком)
    beads = [(262, 580), (272, 587), (283, 592), (294, 594), (306, 594), (317, 592), (328, 587), (338, 580)]
    body.append(G('necklace', *necklace(beads, (300, 597))))

    # лицо
    CAP = ('M93 452 C92 410 90 364 96 312 C106 212 188 146 300 146 '
           'C412 146 494 212 504 312 C510 364 508 410 507 452 L476 452 '
           'C474 410 468 376 454 350 C444 330 424 312 404 300 L392 314 '
           'C360 284 300 248 240 236 '
           'C206 244 172 266 152 300 C138 326 130 380 128 452 Z')
    defs.append(clip(f'{pfx}-face-clip', FACE))
    body.append(G('face',
                  fill_only(FACE, SKIN),
                  shade(f'{pfx}-face-clip',
                        fill_only(FACE, SKIN_SH),
                        fill_only(FACE, SKIN, extra='transform="translate(0 -16)"'),
                        fill_only(CAP, SKIN_SH, extra='transform="translate(-4 13)"')),
                  P(FACE)))

    body.append(G('face-features',
                  f'<ellipse cx="200" cy="472" rx="22" ry="12" fill="{BLUSH}"/>',
                  f'<ellipse cx="400" cy="472" rx="22" ry="12" fill="{BLUSH}"/>',
                  f'<ellipse cx="236" cy="415" rx="10" ry="19" fill="{OUT}"/>',
                  f'<ellipse cx="364" cy="415" rx="10" ry="19" fill="{OUT}"/>',
                  P('M212 366 C226 354 246 352 260 358', sw=6),
                  P('M388 366 C374 354 354 352 340 358', sw=6),
                  P('M306 425 L292 459 L311 464', sw=6),
                  P('M268 500 C282 516 318 516 332 500', sw=6)))

    # волосы спереди: макушка и чёлка набок от пробора
    defs.append(clip(f'{pfx}-hair-clip', CAP))
    body.append(G('hair',
                  fill_only(CAP, HAIR),
                  shade(f'{pfx}-hair-clip',
                        fill_only('M396 120 C452 170 476 250 480 330 L480 460 L560 460 L560 120 Z', HAIR_SH)),
                  P(CAP),
                  P('M240 236 C246 204 256 176 272 150', sw=DET),
                  P('M270 222 C326 204 402 222 452 282', sw=DET),
                  P('M214 242 C188 238 164 250 150 270', sw=DET)))

    # уши поверх заправленных волос
    body.append(G('ear-right', *ear(EAR_VL, EAR_IN_VL)))
    body.append(G('ear-left', *ear(EAR_VR, EAR_IN_VR)))

    return '\n'.join(defs), '\n'.join(body)


# ================================================================== СБОКУ
def side(pfx='side'):
    """Профиль: смотрит влево, видна правая сторона героини."""
    defs, body = [], []
    G = grouper(pfx)

    HEAD = ('M300 186 C211 186 145 238 133 318 C129 355 129 388 127 413 '
            'C121 426 110 444 106 455 C114 460 123 462 131 464 '
            'C127 487 125 507 129 524 C135 557 168 583 227 585 '
            'C300 586 375 577 422 553 C475 520 494 440 492 365 '
            'C488 252 403 186 300 186 Z')

    body.append(G('leg-left', P('M326 780 L326 950 L298 952', sw=LIMB)))
    body.append(G('leg-right', P('M278 780 L278 950 L250 952', sw=LIMB)))

    TOPD = ('M268 562 L372 562 C378 612 382 712 386 796 '
            'C340 804 296 804 252 796 C258 720 262 640 268 562 Z')
    defs.append(clip(f'{pfx}-top-clip', TOPD))
    body.append(G('top', fill_only(TOPD, TOP),
                  shade(f'{pfx}-top-clip',
                        fill_only(HEAD, TOP_SH, extra='transform="translate(0 20)"')),
                  P(TOPD)))
    body.append(G('necklace', *necklace([(292, 592), (281, 597), (270, 600)], (268, 602))))

    body.append(G('arm-right', P('M320 596 C318 660 312 730 302 804', sw=LIMB)))

    HAIR_D = ('M300 146 C420 146 500 206 512 306 C518 356 518 420 514 480 '
              'C512 530 510 566 496 584 C484 596 456 598 420 596 '
              'C396 594 380 588 372 576 C364 550 360 504 352 470 '
              'C344 432 330 406 310 388 C290 368 264 348 238 332 '
              'C214 318 190 310 170 306 C160 318 150 332 142 346 '
              'C136 330 130 314 124 300 C118 262 124 214 148 186 '
              'C182 158 236 146 300 146 Z')

    defs.append(clip(f'{pfx}-head-clip', HEAD))
    body.append(G('head',
                  fill_only(HEAD, SKIN),
                  shade(f'{pfx}-head-clip',
                        fill_only(HEAD, SKIN_SH),
                        fill_only(HEAD, SKIN, extra='transform="translate(0 -16)"'),
                        fill_only(HAIR_D, SKIN_SH, extra='transform="translate(-8 12)"')),
                  P(HEAD)))

    body.append(G('face-features',
                  f'<ellipse cx="214" cy="474" rx="20" ry="11" fill="{BLUSH}"/>',
                  f'<ellipse cx="178" cy="415" rx="9" ry="19" fill="{OUT}"/>',
                  P('M154 366 C166 356 184 354 200 360', sw=6),
                  P('M130 505 C140 512 150 512 160 503', sw=6)))

    defs.append(clip(f'{pfx}-hair-clip', HAIR_D))
    body.append(G('hair', fill_only(HAIR_D, HAIR),
                  shade(f'{pfx}-hair-clip',
                        fill_only('M418 130 C484 196 496 330 478 620 L600 620 L600 130 Z', HAIR_SH)),
                  P(HAIR_D),
                  P('M180 190 C262 160 390 180 466 256', sw=DET),
                  P('M238 332 C320 302 426 330 486 416', sw=DET),
                  P('M494 476 C498 512 494 546 482 572', sw=DET)))

    body.append(G('ear-right',
                  shape('M328 417 C353 393 388 410 386 447 C385 481 356 494 332 481 '
                        'C317 464 317 432 328 417 Z', SKIN),
                  P('M349 429 C366 434 370 457 355 468', sw=DET)))

    return '\n'.join(defs), '\n'.join(body)


# ================================================================== СЗАДИ
def back(pfx='back'):
    defs, body = [], []
    G = grouper(pfx)

    body.append(G('leg-left', P(LEG_VL, sw=LIMB)))
    body.append(G('leg-right', P(LEG_VR, sw=LIMB)))
    body.append(G('arm-left', P(ARM_VL, sw=LIMB)))
    body.append(G('arm-right', P(ARM_VR, sw=LIMB)))

    TOPD = ('M222 564 L378 564 C374 586 380 608 392 620 '
            'C395 680 398 740 400 796 C334 806 266 806 200 796 '
            'C202 740 205 680 208 620 C220 608 226 586 222 564 Z')
    defs.append(clip(f'{pfx}-top-clip', TOPD))
    body.append(G('top', fill_only(TOPD, TOP),
                  shade(f'{pfx}-top-clip',
                        fill_only(BOB, TOP_SH, extra='transform="translate(0 18)"'),
                        fill_only(TOP_EDGE_SH, TOP_SH)),
                  P(TOPD)))

    # уши сзади выглядывают из-под каре
    body.append(G('ear-left', shape(EAR_VL + ' Z', SKIN), P(EAR_IN_VL, sw=DET, stroke=SKIN_SH)))
    body.append(G('ear-right', shape(EAR_VR + ' Z', SKIN), P(EAR_IN_VR, sw=DET, stroke=SKIN_SH)))

    defs.append(clip(f'{pfx}-hair-clip', BOB))
    body.append(G('hair', fill_only(BOB, HAIR),
                  shade(f'{pfx}-hair-clip',
                        fill_only('M404 130 C466 204 482 360 466 620 L600 620 L600 130 Z', HAIR_SH),
                        fill_only('M90 546 C124 570 204 584 300 586 C396 584 476 570 510 546 '
                                  'L540 640 L60 640 Z', HAIR_SH)),
                  P(BOB),
                  P('M268 158 C226 230 208 380 222 574', sw=DET),
                  P('M334 158 C378 230 394 380 380 574', sw=DET),
                  P('M300 154 C288 214 290 270 302 320', sw=DET)))

    return '\n'.join(defs), '\n'.join(body)


VIEWS = (('front', front), ('side', side), ('back', back))
