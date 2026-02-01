import vosk
import sys
import sounddevice as sd
import json
import os

import argparse

# Argument parser ekleyelim
parser = argparse.ArgumentParser()
parser.add_argument("-d", "--device", type=int, help="Cihaz indeksi")
args = parser.parse_args()

# Model yolunu otomatik bulalım
MODEL_PATH = "vosk-model-small-tr-0.3"

if not os.path.exists(MODEL_PATH):
    print(f"HATA: {MODEL_PATH} dizini bulunamadı!")
    sys.exit(1)

model = vosk.Model(MODEL_PATH)
rec = vosk.KaldiRecognizer(model, 16000)

def callback(indata, frames, time, status):
    if status:
        print(status, file=sys.stderr)
    if rec.AcceptWaveform(bytes(indata)):
        result = json.loads(rec.Result())
        text = result.get("text", "")
        if text:
            print(f"VOICE_COMMAND:{text}")
            sys.stdout.flush()

# Mikrofondan dinlemeye başla
try:
    with sd.RawInputStream(samplerate=16000, blocksize=8000, dtype='int16',
                           channels=1, callback=callback, device=args.device):
        while True:
            pass
except Exception as e:
    print(f"HATA: Mikrofona erişilemedi - {e}")
    sys.exit(1)
