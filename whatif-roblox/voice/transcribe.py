#!/usr/bin/env python3
"""Word-level timestamps for every take (faster-whisper) -> voice/words/takeXX.json"""
import glob, json, os, sys, wave
import numpy as np, subprocess
from faster_whisper import WhisperModel
HERE = os.path.dirname(os.path.abspath(__file__))
model = WhisperModel(sys.argv[1] if len(sys.argv) > 1 else 'small', device='cpu', compute_type='int8', cpu_threads=4)
for mp3 in sorted(glob.glob(os.path.join(HERE, 'takes', 'take*.mp3'))):
    name = os.path.basename(mp3)[:-4]
    out = os.path.join(HERE, 'words', name + '.json')
    if os.path.exists(out):
        continue
    pcm = subprocess.run(['ffmpeg', '-v', 'error', '-i', mp3, '-f', 'f32le', '-ac', '1', '-ar', '16000', '-'], capture_output=True, check=True).stdout
    audio = np.frombuffer(pcm, np.float32)
    segs, info = model.transcribe(audio, language='en', word_timestamps=True, vad_filter=False, beam_size=5,
                                  condition_on_previous_text=False)
    words = []
    for s in segs:
        for w in s.words:
            words.append([round(w.start, 3), round(w.end, 3), w.word.strip(), round(w.probability, 3)])
    json.dump(words, open(out, 'w'))
    print(name, len(words), 'words', flush=True)
