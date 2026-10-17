# Zombie Outbreak: 30 Days Locked Inside a New York Mall

Анимационный ролик примерно на 15 минут в стиле канала @NobodyGetsIn, но со своими
персонажами, сюжетом и настоящей анимацией: ходьба и бег по скелету с IK, камера
с облётами, наездами и параллаксом, смена дня и ночи, свет фонарика.

- `docs/01_analysis.md` — анализ канала и присланного ролика.
- `docs/03_script.md` — сценарий: озвучка на английском, перевод и кадры по дням.
- `docs/characters_sheet.png` — персонажи: виды, эмоции, цикл шага и бега.

## Структура

| Путь | Что там |
|---|---|
| `engine/` | движок: скелет персонажа (`rig.py`), собака (`dog.py`), камера и планы (`film.py`), свет и эффекты (`fx.py`), надписи и счётчик дней (`overlay.py`), рендер (`render.py`) |
| `sets/` | фоны: город и улица, интерьеры ТЦ, магазины |
| `scenes/` | сцены: `cold.py` (холодный старт), `d01.py` … `d30.py`, `epi.py`, `end.py`; `timeline.py` собирает фильм |
| `script/narration.json` | текст озвучки по репликам |
| `tools/` | озвучка, разметка, звук, рендер, превью |
| `assets/fonts/` | шрифты (OFL): Montserrat — счётчик дней, Patrick Hand — субтитры, Archivo Black — заголовки |

## Как собрать

```bash
pip install pycairo numpy pillow scipy soundfile faster-whisper num2words

# 1. Озвучка голосом из образца (Chatterbox, отдельное окружение с torch)
python tools/tts_generate.py build/voice_sample.wav        # build/voice/*.wav
# 2. Разметка: проверка распознаванием и раскладка реплик по 30-секундным дням
python tools/voice_timing.py                               # build/voice/timing.json
# 3. Звук: музыка и эффекты синтезируются, сведение с голосом
python tools/audio.py                                      # build/audio/mix.wav
# 4. Видео: по файлу на сегмент, склейка и звук
python tools/render_all.py --jobs 4                        # build/LibertyMall_30days.mp4
```

Проверка отдельного дня: `python tools/preview.py sheet d07` (контактный лист),
`python tools/preview.py still d07 12.5`, `python tools/preview.py clip d07 0 5`.

## Хронометраж

Холодный старт 10 с → дни 1–30 по 30 с → эпилог 12 с → конечная заставка 6 с
(место под элементы YouTube «смотреть дальше» и «подписаться»). Итого 15:28.
