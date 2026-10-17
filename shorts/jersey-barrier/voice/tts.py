# Voice-cloned TTS with Chatterbox on CPU.
# usage: tts.py <ref.wav> <lines.txt> <outdir> [exaggeration] [cfg_weight] [seed]
# Each non-empty line of lines.txt is rendered to <outdir>/NN.wav (one take per line).
import sys, time, os, torch, torchaudio
from chatterbox.tts import ChatterboxTTS

ref, lines_path, outdir = sys.argv[1:4]
exag = float(sys.argv[4]) if len(sys.argv) > 4 else 0.6
cfg = float(sys.argv[5]) if len(sys.argv) > 5 else 0.4
seed = int(sys.argv[6]) if len(sys.argv) > 6 else 7
os.makedirs(outdir, exist_ok=True)
torch.set_num_threads(4)
model = ChatterboxTTS.from_pretrained(device="cpu")
lines = [l.strip() for l in open(lines_path) if l.strip()]
for i, text in enumerate(lines):
    torch.manual_seed(seed + i)
    t = time.time()
    wav = model.generate(text, audio_prompt_path=ref, exaggeration=exag, cfg_weight=cfg)
    path = os.path.join(outdir, f"{i:02d}.wav")
    torchaudio.save(path, wav, model.sr)
    print(f"{i:02d} {wav.shape[1] / model.sr:.2f}s audio in {time.time() - t:.1f}s: {text}", flush=True)
