"""Девочка в худи: тёмное каре с серыми бликами и зелёной заколкой, большие
круглые глаза, серо-голубое худи со светлым капюшоном, зелёная плиссированная
юбка, белые гольфы, коричневые ботинки. Нарисована в стиле своего референса:
тонкий контур, плоская заливка без теней, ноги и руки с толщиной (не палки).

Поза нейтральная: руки опущены вдоль тела, ноги прямо, лицо без эмоций.
Виды: спереди, 3/4 и сбоку; в 3/4 и сбоку она повёрнута лицом влево от зрителя,
поэтому видна её левая сторона — с ухом и заколкой.

Холст вида 600×1100, земля y=1052.
Группы <g id="вид-часть">; «left/right» — сторона самой героини, а не зрителя.
"""
import re

from charlib import OUT, P, clip, fill_only, grouper, shade

NAME = 'hoodie_girl'
TITLE = 'Девочка в худи'
W, H = 600, 1100
GROUND = 1052
GUIDES = (77, 208, 290, 516, 586, 1052)   # макушка, глаза, подбородок, низ худи, подол, земля

SW = 4.5   # контур
DT = 3     # внутренние линии

# ------------------------------------------------------------------ палитра
SKIN = '#edbf8e'
HAIR = '#464553'
HAIR_HL = '#73737d'   # серые блики на волосах
CLIP = '#7cc36e'      # заколка
CLIP_DK = '#4c8a4e'
EYE = '#ffffff'
PUPIL = '#4c4c4c'
HOODIE = '#93afb2'
TRIM = '#c3d3d3'      # капюшон, манжеты, пояс худи, шнурки
BADGE = '#e58a95'     # значок на груди
BADGE_DK = '#d4473f'
SKIRT = '#65a582'
SOCK = '#e3ebed'
SHOE = '#8c6757'
SOLE = '#69636d'

PALETTE = (('Кожа', SKIN), ('Волосы', HAIR), ('Блики', HAIR_HL), ('Заколка', CLIP),
           ('Худи', HOODIE), ('Капюшон', TRIM), ('Значок', BADGE_DK), ('Юбка', SKIRT),
           ('Гольфы', SOCK), ('Ботинки', SHOE), ('Подошва', SOLE), ('Контур', OUT))


def mx(d, axis=300):
    """Зеркалит путь из абсолютных команд M/L/C/Q/Z относительно вертикали x=axis."""
    out, nums = [], []
    for tok in re.findall(r'[A-Za-z]|-?\d+(?:\.\d+)?', d):
        if tok.isalpha():
            out.append(tok)
            nums = []
            continue
        nums.append(tok)
        if len(nums) % 2:
            out.append(f'{2 * axis - float(tok):g}')
        else:
            out.append(tok)
    return re.sub(r' ?([A-Za-z]) ', r' \1', ' '.join(out)).strip()


def line(d, sw=DT):
    return P(d, sw=sw)


def part(d, fill, sw=SW):
    return P(d, fill=fill, sw=sw)


def clip_badge(cx, cy, angle):
    """Заколка-«капелька» с треугольным вырезом."""
    return (f'<g transform="translate({cx} {cy}) rotate({angle})">'
            + part('M0 -20 C10 -20 13 -10 12 0 C11 12 4 20 0 22 C-4 20 -11 12 -12 0 '
                   'C-13 -10 -10 -20 0 -20 Z', CLIP, sw=3)
            + part('M0 -11 L5 6 L-5 6 Z', CLIP_DK, sw=2) + '</g>')


def pin(x, y):
    """Значок на груди: серый зажим и квадратик из двух цветов."""
    return ''.join((
        f'<rect x="{x - 3}" y="{y - 12}" width="6" height="22" rx="3" fill="{TRIM}" '
        f'stroke="{OUT}" stroke-width="2"/>',
        f'<rect x="{x + 3}" y="{y - 6}" width="13" height="13" rx="2" fill="{BADGE}" '
        f'stroke="{OUT}" stroke-width="2"/>',
        fill_only(f'M{x + 9.5} {y - 5} L{x + 15} {y - 5} L{x + 15} {y + 0.5} L{x + 9.5} {y + 0.5} Z',
                  BADGE_DK),
    ))


def leg(cx, top=568):
    """Нога от юбки до щиколотки, чуть сужается книзу (cx — центр у бедра)."""
    return (f'M{cx - 20} {top} C{cx - 19} 640 {cx - 17} 720 {cx - 16} 790 '
            f'L{cx + 14} 790 C{cx + 15} 720 {cx + 18} 640 {cx + 20} {top} Z')


def sock(cx):
    """Гольф до колена с подвёрнутым краем."""
    return (f'M{cx - 19} 778 C{cx - 20} 775 {cx - 18} 771 {cx - 14} 771 L{cx + 14} 771 '
            f'C{cx + 18} 771 {cx + 20} 775 {cx + 18} 779 C{cx + 17} 840 {cx + 16} 900 {cx + 16} 980 '
            f'L{cx - 15} 980 C{cx - 16} 900 {cx - 17} 840 {cx - 19} 778 Z')


def sock_fold(cx):
    return line(f'M{cx - 17} 790 C{cx - 6} 794 {cx + 6} 794 {cx + 17} 790')


def hair(G, pfx, defs, bob, outer, seam, hairline, dx=0):
    """Волосы двумя слоями: каре за лицом и «шапка» поверх лба.

    Шапка = outer (силуэт) + seam (стык с каре, без контура) + hairline (край у
    лица). Стык не обводится, поэтому шапка и каре сливаются в одну массу.
    """
    hl = fill_only(HL, HAIR_HL, extra=f'transform="translate({dx} 0)"')
    cap = f'{outer} {seam} {hairline.split(" ", 2)[2]} Z'
    defs.append(clip(f'{pfx}-bob-clip', bob))
    defs.append(clip(f'{pfx}-cap-clip', cap))
    back = G('hair-back', part(bob, HAIR), shade(f'{pfx}-bob-clip', hl), part(bob, 'none'))
    front = G('hair', fill_only(cap, HAIR), shade(f'{pfx}-cap-clip', hl),
              line(outer, SW), line(hairline, SW))
    return back, front


# серые блики: волнистая полоса вокруг головы
HL = ('M140 166 C160 142 178 122 202 128 C224 134 230 108 254 110 '
      'C278 112 282 96 306 98 C330 100 338 88 362 96 C386 104 394 116 416 110 '
      'C438 104 450 120 470 128 L470 174 C450 166 434 154 418 162 '
      'C402 170 394 182 376 170 C358 158 346 148 326 154 C306 160 298 176 278 166 '
      'C258 156 246 146 228 160 C210 174 198 188 180 176 C164 166 154 174 140 196 Z')


# ================================================================== СПЕРЕДИ
FACE_F = ('M300 116 C358 116 392 160 392 214 C392 262 356 290 300 290 '
          'C244 290 208 262 208 214 C208 160 242 116 300 116 Z')
# каре за лицом: справа от зрителя (её левая сторона) волосы заправлены за ухо
# и торчат завитком под ним, слева закрывают ухо и топорщатся прядкой
BOB_F = ('M300 77 C380 77 428 126 430 196 C431 222 426 244 432 266 '
         'C422 272 410 270 404 262 C406 272 402 280 394 286 '
         'C390 272 386 262 380 256 L216 258 '
         'C206 268 196 274 182 274 C188 264 186 256 180 250 '
         'C172 248 162 244 152 242 C164 232 170 218 172 206 '
         'C170 132 220 77 300 77 Z')
# шапка: пробор чуть правее центра, лоб открыт «аркой»
OUTER_F = ('M180 250 C172 248 162 244 152 242 C164 232 170 218 172 206 '
           'C170 132 220 77 300 77 C380 77 428 126 430 196')
SEAM_F = 'C418 206 402 208 388 206'
HAIRLINE_F = ('M388 206 C376 176 352 148 322 130 C278 150 238 186 212 228 '
              'C208 240 210 250 216 258 C206 268 196 274 182 274 C188 264 186 256 180 250')
EAR_F = 'M388 204 C404 194 420 204 418 226 C416 248 400 256 386 248'

NECK_F = 'M290 262 L310 262 L311 330 L289 330 Z'
HOOD_BACK_F = 'M240 340 C238 312 266 294 300 294 C334 294 362 312 360 340 Z'
TORSO_F = ('M240 330 C256 320 278 314 300 314 C322 314 344 320 360 330 '
           'C368 380 370 440 370 496 L230 496 C230 440 232 380 240 330 Z')
# шалевый воротник-капюшон: две половины сходятся «галочкой» на груди
LAPEL_F = ('M290 304 C270 300 248 308 236 326 C230 336 230 348 236 356 '
           'C258 358 282 364 300 378 L300 354 C296 338 292 320 290 304 Z')
HEM_F = ('M228 492 L372 492 C375 500 375 509 373 517 C324 523 276 523 227 517 '
         'C225 509 225 500 228 492 Z')
SLEEVE_F = ('M246 328 C228 330 214 344 210 368 C204 412 204 472 208 522 '
            'L244 524 C246 472 246 414 244 374 Z')
CUFF_F = 'M207 518 L245 520 C246 526 246 534 245 540 L208 539 C206 532 206 525 207 518 Z'
HAND_F = ('M211 536 C205 554 205 576 215 588 C223 596 238 594 242 582 '
          'C246 568 245 550 243 536 Z')
THUMB_F = 'M238 550 C244 558 244 570 236 576'
SKIRT_F = ('M238 512 L362 512 C370 534 376 558 382 580 C328 592 272 592 218 580 '
           'C224 558 230 534 238 512 Z')
SHOE_F = ('M220 1040 C214 1006 228 978 254 970 C276 964 298 972 304 992 '
          'C308 1008 308 1026 304 1040 Z')
SOLE_F = ('M216 1034 L308 1034 C310 1042 309 1049 303 1052 L222 1052 '
          'C216 1049 214 1042 216 1034 Z')


def front(pfx='front'):
    defs, body = [], []
    G = grouper(pfx)
    hair_back, hair_front = hair(G, pfx, defs, BOB_F, OUTER_F, SEAM_F, HAIRLINE_F)
    body.append(hair_back)

    # ноги: правая — слева от зрителя
    for side, m in (('right', lambda d: d), ('left', mx)):
        body.append(G(f'leg-{side}', part(m(leg(272)), SKIN)))
        body.append(G(f'sock-{side}', part(m(sock(271)), SOCK), m(sock_fold(271))))
        body.append(G(f'shoe-{side}', part(m(SOLE_F), SOLE), part(m(SHOE_F), SHOE),
                      line(m('M234 1000 C244 986 282 984 294 998')),
                      line(m('M242 1014 C254 1008 280 1008 292 1014'))))

    body.append(G('skirt', part(SKIRT_F, SKIRT),
                  line('M258 520 L246 584'), line('M284 520 L278 589'),
                  line('M316 520 L322 589'), line('M342 520 L354 584')))

    body.append(G('hood-back', part(HOOD_BACK_F, TRIM)))
    body.append(G('neck', part(NECK_F, SKIN)))

    # руки: правая — слева от зрителя
    for side, m in (('right', lambda d: d), ('left', mx)):
        body.append(G(f'hand-{side}', part(m(HAND_F), SKIN), line(m(THUMB_F))))
        body.append(G(f'arm-{side}', part(m(SLEEVE_F), HOODIE),
                      line(m('M216 428 C224 434 234 434 242 430')),
                      part(m(CUFF_F), TRIM)))

    body.append(G('hoodie', part(TORSO_F, HOODIE),
                  fill_only('M289 306 L311 306 L300 352 Z', SKIN),
                  line('M300 360 L300 494'),
                  zipper(300, 366),
                  part(HEM_F, TRIM),
                  pin(326, 380)))
    body.append(G('hood', part(LAPEL_F, TRIM), part(mx(LAPEL_F), TRIM),
                  *cord('M290 368 C288 382 288 396 290 410'),
                  *cord('M310 368 C312 382 312 396 310 410')))

    body.append(G('face', part(FACE_F, SKIN)))
    body.append(G('face-features',
                  eye(267, 208, 32, 27), eye(333, 208, 32, 27),
                  pupil(267, 210, 12), pupil(333, 210, 12),
                  line('M237 198 L229 192', sw=2.5), line('M363 198 L371 192', sw=2.5),
                  line('M252 170 C260 165 272 165 282 168', sw=2.5),
                  line('M318 168 C328 165 340 165 348 170', sw=2.5),
                  line('M302 244 C306 247 305 252 299 252', sw=2.5),
                  line('M294 268 L306 268', sw=2.5)))

    body.append(hair_front)
    body.append(G('hair-part', line('M322 130 C316 114 310 100 302 88')))
    body.append(G('hair-clip', clip_badge(390, 138, 40)))
    # ухо поверх волос: волосы заправлены за него
    body.append(G('ear-left', part(EAR_F, SKIN), line('M400 214 C410 220 410 236 400 242')))

    return '\n'.join(defs), '\n'.join(body)


# ================================================================== 3/4
# голова и тело повёрнуты на ~45° влево от зрителя: лицо смещено влево,
# справа видны ухо, заколка и капюшон за спиной
FACE_Q = ('M292 116 C344 116 374 152 378 198 C381 236 372 266 344 282 '
          'C322 294 290 294 264 290 C228 284 204 262 198 228 '
          'C194 192 208 150 238 130 C254 120 272 116 292 116 Z')
BOB_Q = ('M296 77 C384 77 436 128 438 198 C439 226 434 246 440 268 '
         'C430 274 418 272 412 264 C414 274 410 282 402 288 '
         'C398 274 392 264 384 258 L230 258 '
         'C222 266 212 270 200 270 C204 262 200 254 194 248 '
         'C184 246 176 242 166 240 C178 230 184 218 186 206 '
         'C184 132 226 77 296 77 Z')
OUTER_Q = ('M194 248 C184 246 176 242 166 240 C178 230 184 218 186 206 '
           'C184 132 226 77 296 77 C384 77 436 128 438 198')
SEAM_Q = 'C420 208 390 208 364 204'
HAIRLINE_Q = ('M364 204 C352 174 330 148 300 130 C262 150 228 184 206 226 '
              'C204 238 206 250 214 260 C208 266 204 270 200 270 C204 262 200 254 194 248')
EAR_Q = 'M362 204 C378 194 396 204 394 226 C392 248 376 256 360 248'
NECK_Q = 'M284 262 L306 262 L308 330 L286 330 Z'
HOOD_BACK_Q = ('M250 336 C252 308 282 292 316 294 C352 296 384 314 394 344 '
               'C400 366 396 392 382 410 C368 394 358 370 352 348 Z')
TORSO_Q = ('M246 332 C262 320 284 314 306 314 C330 314 350 322 362 336 '
           'C368 384 370 440 368 496 L236 496 C236 440 238 384 246 332 Z')
LAPEL_FAR_Q = ('M286 306 C268 304 254 312 246 326 C242 336 242 346 246 352 '
               'C258 356 270 364 280 378 L280 352 C281 336 283 320 286 306 Z')
LAPEL_NEAR_Q = ('M304 304 C330 298 360 306 374 326 C380 336 380 350 372 358 '
                'C344 360 302 366 280 380 L280 352 C288 336 298 318 304 304 Z')
HEM_Q = ('M234 492 L370 492 C373 500 373 509 371 517 C326 523 280 523 233 517 '
         'C231 509 231 500 234 492 Z')
SLEEVE_FAR_Q = ('M252 332 C236 336 226 350 224 372 C220 416 220 474 222 522 '
                'L248 524 C248 474 248 416 248 374 Z')
CUFF_FAR_Q = 'M221 518 L249 520 C250 526 250 534 249 540 L222 539 C220 532 220 525 221 518 Z'
HAND_FAR_Q = ('M224 536 C219 554 220 576 228 588 C236 594 246 590 248 580 '
              'C250 566 249 550 247 536 Z')
SLEEVE_NEAR_Q = ('M330 330 C350 322 372 330 380 352 C388 404 390 470 388 522 '
                 'L352 524 C350 472 348 416 346 380 C342 362 336 346 330 330 Z')
CUFF_NEAR_Q = 'M351 518 L389 520 C390 526 390 534 389 540 L352 540 C350 532 350 525 351 518 Z'
HAND_NEAR_Q = ('M354 536 C349 554 350 576 358 588 C366 596 380 594 384 582 '
               'C388 568 387 550 385 536 Z')
SKIRT_Q = ('M242 512 L364 512 C372 534 380 558 386 580 C332 592 278 592 226 580 '
           'C230 558 236 534 242 512 Z')


def shoe_q(cx):
    """Ботинок в 3/4: носок смотрит влево-вперёд."""
    sole = (f'M{cx - 72} 1034 L{cx + 30} 1034 C{cx + 32} 1042 {cx + 31} 1049 {cx + 25} 1052 '
            f'L{cx - 66} 1052 C{cx - 72} 1049 {cx - 74} 1042 {cx - 72} 1034 Z')
    upper = (f'M{cx - 68} 1040 C{cx - 74} 1014 {cx - 62} 998 {cx - 38} 990 '
             f'C{cx - 24} 984 {cx - 18} 970 {cx} 966 C{cx + 18} 964 {cx + 28} 978 {cx + 28} 996 '
             f'C{cx + 30} 1012 {cx + 30} 1028 {cx + 28} 1040 Z')
    return (part(sole, SOLE), part(upper, SHOE),
            line(f'M{cx - 54} 1004 C{cx - 44} 994 {cx - 26} 990 {cx - 14} 996'),
            line(f'M{cx - 48} 1018 C{cx - 38} 1012 {cx - 24} 1010 {cx - 12} 1014'),
            line(f'M{cx - 15} 980 C{cx - 4} 986 {cx + 10} 986 {cx + 20} 980'))


def three_quarter(pfx='three_quarter'):
    defs, body = [], []
    G = grouper(pfx)
    hair_back, hair_front = hair(G, pfx, defs, BOB_Q, OUTER_Q, SEAM_Q, HAIRLINE_Q, dx=-8)
    body.append(hair_back)
    body.append(G('hood-back', part(HOOD_BACK_Q, TRIM)))

    # дальняя (правая) нога слева, ближняя (левая) — справа и поверх
    for side, cx in (('right', 278), ('left', 322)):
        body.append(G(f'leg-{side}', part(leg(cx), SKIN)))
        body.append(G(f'sock-{side}', part(sock(cx - 1), SOCK), sock_fold(cx - 1)))
        body.append(G(f'shoe-{side}', *shoe_q(cx)))

    body.append(G('skirt', part(SKIRT_Q, SKIRT),
                  line('M262 520 L250 586'), line('M286 520 L280 590'),
                  line('M312 520 L316 590'), line('M338 520 L350 588'),
                  line('M356 518 L370 584')))

    body.append(G('neck', part(NECK_Q, SKIN)))

    body.append(G('hand-right', part(HAND_FAR_Q, SKIN), line('M230 548 C224 556 224 568 232 574')))
    body.append(G('arm-right', part(SLEEVE_FAR_Q, HOODIE), part(CUFF_FAR_Q, TRIM)))

    body.append(G('hoodie', part(TORSO_Q, HOODIE),
                  fill_only('M285 306 L304 306 L280 352 Z', SKIN),
                  line('M280 382 L280 494'),
                  zipper(280, 386),
                  part(HEM_Q, TRIM),
                  pin(318, 392)))
    body.append(G('hand-left', part(HAND_NEAR_Q, SKIN), line('M360 548 C354 556 354 568 362 574')))
    body.append(G('arm-left', part(SLEEVE_NEAR_Q, HOODIE),
                  line('M356 428 C364 434 374 434 384 430'),
                  part(CUFF_NEAR_Q, TRIM)))
    # воротник-капюшон лежит поверх плеча
    body.append(G('hood', part(LAPEL_FAR_Q, TRIM), part(LAPEL_NEAR_Q, TRIM),
                  *cord('M272 372 C270 386 270 400 272 414'),
                  *cord('M290 372 C292 386 292 400 290 414')))

    body.append(G('face', part(FACE_Q, SKIN)))
    body.append(G('face-features',
                  eye(238, 208, 25, 27), eye(296, 208, 31, 27),
                  pupil(231, 210, 11), pupil(287, 210, 12),
                  line('M215 196 L208 190', sw=2.5), line('M325 196 L333 190', sw=2.5),
                  line('M222 172 C228 167 238 166 246 168', sw=2.5),
                  line('M280 168 C290 165 302 165 312 169', sw=2.5),
                  line('M252 242 C247 246 248 251 254 252', sw=2.5),
                  line('M246 268 L258 268', sw=2.5)))

    body.append(hair_front)
    body.append(G('hair-part', line('M300 130 C296 114 292 100 286 88')))
    body.append(G('hair-clip', clip_badge(370, 136, 40)))
    body.append(G('ear-left', part(EAR_Q, SKIN), line('M374 214 C384 220 384 236 374 242')))

    return '\n'.join(defs), '\n'.join(body)


# ================================================================== СБОКУ
# профиль, смотрит влево от зрителя — видна её левая сторона
FACE_S = ('M300 120 C252 120 216 148 212 188 C211 204 209 216 206 226 '
          'C202 232 197 238 198 242 C200 246 204 248 206 252 '
          'C205 258 203 264 205 270 C207 282 216 290 234 292 '
          'C264 294 302 290 332 270 C354 252 362 220 354 180 C346 140 330 120 300 120 Z')
BOB_S = ('M300 77 C382 77 432 124 440 186 C444 220 438 244 444 266 '
         'C434 276 422 276 414 268 C416 280 410 290 400 296 '
         'C394 282 386 272 374 266 C358 268 340 262 326 252 L300 180 Z')
OUTER_S = ('M210 180 C200 164 200 144 212 126 C232 96 262 77 300 77 '
           'C382 77 432 124 440 186')
SEAM_S = 'C412 202 366 208 330 202'
HAIRLINE_S = 'M330 202 C316 194 300 184 280 176 C258 168 232 168 210 180'
EAR_S = 'M318 206 C332 192 354 200 354 226 C354 250 334 258 318 248'
NECK_S = 'M276 262 L302 262 L306 330 L278 330 Z'
TORSO_S = ('M262 326 C282 314 318 312 340 320 C352 360 356 430 354 496 '
           'L248 496 C248 440 250 372 262 326 Z')
# капюшон лежит на спине, спереди переходит в воротник вокруг шеи
HOOD_S = ('M256 350 C254 330 258 314 268 304 C286 294 320 292 346 300 '
          'C368 306 382 326 384 352 C386 378 380 396 368 406 '
          'C358 414 344 410 342 398 C338 374 334 352 322 340 '
          'C310 336 296 338 286 346 C278 352 266 356 256 350 Z')
HOOD_RIM_S = 'M304 300 C322 310 332 326 334 346'
HEM_S = ('M246 492 L356 492 C359 500 359 509 357 517 C320 522 284 522 245 517 '
         'C243 509 243 500 246 492 Z')
SLEEVE_S = ('M284 330 C304 322 324 332 326 356 C330 410 330 470 326 522 '
            'L292 524 C288 470 284 410 284 356 Z')
CUFF_S = 'M291 518 L327 520 C328 526 328 534 327 540 L292 540 C290 532 290 525 291 518 Z'
HAND_S = ('M293 536 C288 556 290 576 300 588 C310 596 322 590 324 578 '
          'C326 562 326 548 324 536 Z')
SKIRT_S = ('M252 512 L350 512 C360 534 370 558 378 580 C332 590 270 590 224 580 '
           'C232 558 242 534 252 512 Z')


def leg_s(cx, top=568):
    """Нога в профиль: икра чуть выгнута назад."""
    return (f'M{cx - 19} {top} C{cx - 18} 640 {cx - 16} 720 {cx - 15} 790 '
            f'L{cx + 15} 790 C{cx + 18} 740 {cx + 20} 680 {cx + 19} {top} Z')


def shoe_s(cx):
    """Ботинок в профиль, носок влево."""
    sole = (f'M{cx - 84} 1034 L{cx + 32} 1034 C{cx + 34} 1042 {cx + 33} 1049 {cx + 27} 1052 '
            f'L{cx - 78} 1052 C{cx - 84} 1049 {cx - 86} 1042 {cx - 84} 1034 Z')
    upper = (f'M{cx - 80} 1040 C{cx - 84} 1016 {cx - 72} 1002 {cx - 50} 996 '
             f'C{cx - 34} 992 {cx - 22} 982 {cx - 18} 968 L{cx + 18} 966 '
             f'C{cx + 28} 978 {cx + 32} 1008 {cx + 30} 1040 Z')
    return (part(sole, SOLE), part(upper, SHOE),
            line(f'M{cx - 62} 1004 C{cx - 50} 998 {cx - 34} 996 {cx - 24} 1000'),
            line(f'M{cx - 56} 1018 C{cx - 44} 1012 {cx - 30} 1010 {cx - 20} 1014'),
            line(f'M{cx - 18} 980 C{cx - 4} 986 {cx + 12} 984 {cx + 22} 978'))


def side(pfx='side'):
    defs, body = [], []
    G = grouper(pfx)
    hair_back, hair_front = hair(G, pfx, defs, BOB_S, OUTER_S, SEAM_S, HAIRLINE_S, dx=4)
    body.append(hair_back)

    # дальняя (правая) нога чуть сзади, ближняя (левая) — поверх
    for side_, cx in (('right', 316), ('left', 296)):
        body.append(G(f'leg-{side_}', part(leg_s(cx), SKIN)))
        body.append(G(f'sock-{side_}', part(sock(cx), SOCK), sock_fold(cx)))
        body.append(G(f'shoe-{side_}', *shoe_s(cx)))

    body.append(G('skirt', part(SKIRT_S, SKIRT),
                  line('M268 520 L250 586'), line('M294 520 L286 590'),
                  line('M322 520 L328 590'), line('M342 520 L358 586')))

    body.append(G('neck', part(NECK_S, SKIN)))
    body.append(G('hoodie', part(TORSO_S, HOODIE), part(HEM_S, TRIM)))

    body.append(G('hand-left', part(HAND_S, SKIN), line('M298 548 C290 556 290 568 298 574')))
    body.append(G('arm-left', part(SLEEVE_S, HOODIE),
                  line('M292 428 C302 434 314 434 326 430'),
                  part(CUFF_S, TRIM)))
    body.append(G('hood', part(HOOD_S, TRIM), line(HOOD_RIM_S),
                  *cord('M262 352 C258 368 258 384 260 398')))

    body.append(G('face', part(FACE_S, SKIN)))
    body.append(G('face-features',
                  eye(232, 210, 18, 26), pupil(224, 212, 10),
                  line('M246 196 L254 190', sw=2.5),
                  line('M205 267 L213 267', sw=2.5)))

    body.append(hair_front)
    body.append(G('hair-clip', clip_badge(300, 140, 40)))
    body.append(G('ear-left', part(EAR_S, SKIN), line('M330 214 C342 220 342 236 330 242')))

    return '\n'.join(defs), '\n'.join(body)


def eye(cx, cy, rx, ry):
    return (f'<ellipse cx="{cx}" cy="{cy}" rx="{rx}" ry="{ry}" fill="{EYE}" '
            f'stroke="{OUT}" stroke-width="{DT}"/>')


def pupil(cx, cy, r):
    return f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="{PUPIL}"/>'


def cord(d):
    """Шнурок капюшона: светлая линия с контуром."""
    return P(d, sw=7), P(d, sw=3.5, stroke=TRIM)


def zipper(x, y):
    return (f'<rect x="{x - 5}" y="{y}" width="10" height="18" rx="3" fill="{TRIM}" '
            f'stroke="{OUT}" stroke-width="2.5"/>')


VIEWS = (('front', front), ('three_quarter', three_quarter), ('side', side))
