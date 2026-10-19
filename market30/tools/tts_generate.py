"""Озвучка: клонирование голоса из образца (Chatterbox), по одной реплике на файл.

Запуск (в venv с chatterbox-tts):
    python tools/tts_generate.py <образец.wav> [ключ ...] [--redo ключ_NN ...]
Готовые файлы пропускаются; --redo перегенерирует указанные реплики с новым seed.
"""
import json, os, sys, time
import torch, torchaudio as ta
from chatterbox.tts import ChatterboxTTS

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "build", "voice")


def main():
    args = sys.argv[1:]
    ref = args.pop(0)
    redo = {}
    if "--redo" in args:
        i = args.index("--redo")
        for r in args[i + 1:]:
            name, _, seed = r.partition(":")
            redo[name] = int(seed or 1)
        args = args[:i]
    lines = json.load(open(os.path.join(ROOT, "script", "narration.json")))
    keys = args or list(lines)
    os.makedirs(OUT, exist_ok=True)
    torch.set_num_threads(int(os.environ.get("TTS_THREADS", "4")))
    model = ChatterboxTTS.from_pretrained(device="cpu")
    for key in keys:
        for i, text in enumerate(lines[key]):
            name = f"{key}_{i:02d}"
            path = os.path.join(OUT, name + ".wav")
            if os.path.exists(path) and name not in redo:
                continue
            seed = redo.get(name, 0)
            torch.manual_seed(1000 + seed)
            t = time.time()
            wav = model.generate(text, audio_prompt_path=ref, exaggeration=0.5, cfg_weight=0.5, temperature=0.8)
            ta.save(path, wav, model.sr)
            print(f"{name} seed={seed} {wav.shape[-1] / model.sr:.2f}s audio in {time.time() - t:.0f}s", flush=True)


if __name__ == "__main__":
    main()
