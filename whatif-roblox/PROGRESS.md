# Производство: прогресс и план

Каждая часть — свой модуль `scenes/scXX.js` с `START`, `END`, `scene(t)`, `TRACK` (реплики → субтитры и рты).
`scenes/main.js` склеивает сегменты. Части рендерятся отдельно:

```bash
node scenes/main.js out/part_NN.mp4 60 START END
```

Полный ролик: `ffmpeg -f concat` всех частей (видео в git не кладём — > 100 МБ).

| Часть | Время | Сцены | Модуль |
|---|---|---|---|
| 1 | 0:00–1:01 | SC01 холодное открытие + SC02 ночь | intro, sc01b, sc02 |
| 2 | 1:01–2:03.6 | SC03 утро (зеркало, мама, блин) | sc03 |
| 3 | 2:03.6–3:15.4 | SC03 папа + SC04 мир Roblox | sc04 |
| 4 | 3:15.4–4:21 | SC05 порталы | sc05 |
| 5 | 4:21–5:41.4 | SC06 Steal an Egg: новичок, Рокки | sc06 |
| 6 | 5:41.4–6:54 | SC07 Speedy, EggLord, ZAP | sc07 |
| 7 | 6:54–7:46.4 | SC08 Nova + SC09 подписка | sc08 |
| 8 | 7:46.4–8:37.2 | SC10 гринд, Рокки дома | sc10 |
| 9 | 8:37.2–9:36.8 | SC10 Nova, закат, рейтинг, дождь из яиц | sc10b |
| 10 | 9:36.8–10:42 | SC11 хранилище: лазеры, яйца с зубами | sc11 |
| 11 | 10:42–11:34 | SC11 вершина, гонка, кооп-вылупление | sc11b |
| 12 | 11:34–12:51 | SC12 вылупление, SC13 цветы, SC14 аутро | sc12 |

Рендер части: `node scenes/main.js out/part_NN.mp4 60 START END`.
Склейка (список `out/concat.txt`: whatif_1min, whatif_min2, part_03 … part_12):

```bash
ffmpeg -f concat -safe 0 -i out/concat.txt -c copy -movflags +faststart out/whatif_full.mp4
```

## Статус

- Все 12 частей анимированы и отрендерены (1920×1080, 60 fps), полный ролик ≈ 12:51.
- Звук (музыка + SFX + атмосфера) готов: `out/whatif_full_sound.mp4`.
- Дальше: озвучка ElevenLabs v4 (`script/VOICEOVER_eleven_v4.txt`) → подгоняем тайминги
  реплик в `TRACK` под реальные дубли, пересчитываем липсинк, сводим с голосом (`--vo`).

## Звук

| Файл | Что делает |
|---|---|
| `audio/vocab.json` | словарь: ~130 имён SFX, 14 атмосфер, 19 музыкальных настроений |
| `audio/cues/partNN.json` | звуковые партитуры частей (SFX, шаги, атмосфера, музыкальная карта), формат — `audio/CUES.md` |
| `audio/build_sfx.py` | собирает библиотеку `assets/sfx/*.ogg` (CC0-записи + синтез + стинги FluidSynth), источники — `audio/fetch_sources.sh`, лицензии — `assets/sfx/CREDITS.md` |
| `audio/music.py` | оригинальная музыка: главная тема + мотив Nova, 19 стилей → MIDI → FluidSynth (FluidR3 GM), темп подгоняется под длину сцены |
| `audio/mix.py` | сведение: музыка/SFX/атмосфера, лимитер, громкость −15 LUFS, `--mux` кладёт звук в видео, `--vo` — дакинг музыки под голос |
| `tools/strip.sh` | раскадровка с таймкодами для синхронизации звука |

```bash
apt-get install -y fluidsynth fluid-soundfont-gm && pip install scipy mido py7zr
audio/fetch_sources.sh && python3 audio/build_sfx.py      # библиотека (уже лежит в assets/sfx)
python3 audio/mix.py --mux                                 # полный микс → out/whatif_full_sound.mp4
python3 audio/mix.py --vo out/vo.wav --mux                 # когда будет озвучка
```
