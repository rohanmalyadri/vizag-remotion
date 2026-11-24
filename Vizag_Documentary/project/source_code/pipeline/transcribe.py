"""Telugu transcription with word timestamps (faster-whisper, CPU)."""
import json, sys, time, wave
import numpy as np
from faster_whisper import WhisperModel
audio, out, model_name = sys.argv[1], sys.argv[2], (sys.argv[3] if len(sys.argv) > 3 else "large-v3")
t0 = time.time()
model = WhisperModel(model_name, device="cpu", compute_type="int8", cpu_threads=4)
w = wave.open(audio); pcm = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float32) / 32768.0
segs, info = model.transcribe(pcm, language="te", beam_size=5, word_timestamps=True,
                              vad_filter=True, condition_on_previous_text=False)
res = []
for s in segs:
    res.append({"start": s.start, "end": s.end, "text": s.text,
                "words": [{"start": w.start, "end": w.end, "word": w.word, "p": w.probability} for w in (s.words or [])]})
    print(f"[{s.start:7.2f}-{s.end:7.2f}] {s.text}", flush=True)
json.dump({"model": model_name, "duration": info.duration, "segments": res}, open(out, "w"), ensure_ascii=False, indent=1)
print("done in", time.time() - t0, flush=True)
