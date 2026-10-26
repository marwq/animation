#!/usr/bin/env python3
"""Дубли озвучки клоном голоса (Chatterbox TTS, лицензия MIT, работает на CPU).

    python3 tts_lines.py <образец-голоса.wav> <папка> lines.json

Для каждой строки из lines.json и каждого seed пишет <папка>/<id>_s<seed>.wav.
Chatterbox сам встраивает в звук неслышимый водяной знак Perth (метка ИИ-голоса).
"""
import json
import sys

import torch
import torchaudio as ta
from chatterbox.tts import ChatterboxTTS


def main(ref, out_dir, spec_path):
    model = ChatterboxTTS.from_pretrained(device='cpu')
    for line in json.load(open(spec_path)):
        for seed in line.get('seeds', [1, 2, 3]):
            torch.manual_seed(seed)
            wav = model.generate(line['text'], audio_prompt_path=ref,
                                 exaggeration=line.get('ex', 0.55),
                                 cfg_weight=line.get('cfg', 0.5),
                                 temperature=line.get('temp', 0.8))
            path = f"{out_dir}/{line['id']}_s{seed}.wav"
            ta.save(path, wav, model.sr)
            print(path, round(wav.shape[-1] / model.sr, 2), flush=True)


if __name__ == '__main__':
    main(*sys.argv[1:4])
