# usage: wtrans.py <wav> [out.json]  -> words with timestamps (faster-whisper small.en)
import sys, json, subprocess, numpy as np
from faster_whisper import WhisperModel
pcm = subprocess.run(["ffmpeg","-v","error","-i",sys.argv[1],"-ac","1","-ar","16000","-f","s16le","-"],capture_output=True,check=True).stdout
audio = np.frombuffer(pcm, np.int16).astype(np.float32)/32768
m = WhisperModel("small.en", device="cpu", compute_type="int8")
segs, info = m.transcribe(audio, word_timestamps=True, beam_size=5)
ws = []
for s in segs:
    print(f"[{s.start:.2f}-{s.end:.2f}] {s.text}")
    ws += [{"w": w.word.strip(), "s": round(w.start,3), "e": round(w.end,3)} for w in s.words]
n = len(ws); dur = ws[-1]["e"] - ws[0]["s"]
print("words", n, "speech", round(dur,2), "s, wpm", round(n/dur*60))
print("pauses>0.15s:", [(ws[i]["w"], round(ws[i+1]["s"]-ws[i]["e"],2)) for i in range(n-1) if ws[i+1]["s"]-ws[i]["e"] > 0.15])
if len(sys.argv) > 2: json.dump(ws, open(sys.argv[2], "w"), indent=0)
