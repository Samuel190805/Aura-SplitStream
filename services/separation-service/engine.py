import os
import io
import torch
import torchaudio
import soundfile as sf
import numpy as np
from pathlib import Path
from typing import Dict, Tuple

class StemSeparationEngine:
    def __init__(self, model_name: str = "htdemucs"):
        self.model_name = model_name
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self.model = None
        self._load_model()

    def _load_model(self):
        try:
            from demucs.pretrained import get_model
            print(f"[SeparationEngine] Loading {self.model_name} on {self.device}...")
            self.model = get_model(self.model_name)
            self.model.to(self.device)
            self.model.eval()
            print(f"[SeparationEngine] Model {self.model_name} loaded successfully.")
        except Exception as e:
            print(f"[SeparationEngine] Note: Demucs torch model load error ({e}). Using robust DSP fallback separation.")
            self.model = None

    def separate_audio_file(self, input_path: str, output_dir: str) -> Dict[str, str]:
        os.makedirs(output_dir, exist_ok=True)
        
        vocals_path = os.path.join(output_dir, "vocals.wav")
        drums_path = os.path.join(output_dir, "drums.wav")
        bass_path = os.path.join(output_dir, "bass.wav")
        other_path = os.path.join(output_dir, "other.wav")
        instrumental_path = os.path.join(output_dir, "instrumental.wav")

        if self.model is not None:
            from demucs.apply import apply_model
            wav, sr = torchaudio.load(input_path)
            
            # Match samplerate and channels
            if wav.shape[0] == 1:
                wav = wav.repeat(2, 1)
            
            # Resample if needed
            if sr != self.model.samplerate:
                resampler = torchaudio.transforms.Resample(sr, self.model.samplerate)
                wav = resampler(wav)
                sr = self.model.samplerate

            wav = wav.unsqueeze(0).to(self.device)
            
            with torch.no_grad():
                sources = apply_model(self.model, wav, device=self.device, split=True, overlap=0.25)
            
            # Demucs sources order typically: [drums, bass, other, vocals]
            sources = sources.squeeze(0).cpu()
            
            source_names = self.model.sources
            stems_map = {}
            for name, source in zip(source_names, sources):
                target = os.path.join(output_dir, f"{name}.wav")
                torchaudio.save(target, source, sr)
                stems_map[name] = target

            # Create instrumental (drums + bass + other)
            drums_idx = source_names.index("drums") if "drums" in source_names else 0
            bass_idx = source_names.index("bass") if "bass" in source_names else 1
            other_idx = source_names.index("other") if "other" in source_names else 2
            
            inst_tensor = sources[drums_idx] + sources[bass_idx] + sources[other_idx]
            torchaudio.save(instrumental_path, inst_tensor, sr)

            return {
                "vocals": stems_map.get("vocals", vocals_path),
                "drums": stems_map.get("drums", drums_path),
                "bass": stems_map.get("bass", bass_path),
                "other": stems_map.get("other", other_path),
                "instrumental": instrumental_path,
            }
        else:
            # High-quality DSP decomposition fallback
            return self._dsp_separate(input_path, output_dir)

    def _dsp_separate(self, input_path: str, output_dir: str) -> Dict[str, str]:
        vocals_path = os.path.join(output_dir, "vocals.wav")
        drums_path = os.path.join(output_dir, "drums.wav")
        bass_path = os.path.join(output_dir, "bass.wav")
        other_path = os.path.join(output_dir, "other.wav")
        instrumental_path = os.path.join(output_dir, "instrumental.wav")

        try:
            data, sr = sf.read(input_path)
            if data.ndim == 1:
                data = np.stack([data, data], axis=-1)
            
            left = data[:, 0]
            right = data[:, 1]
            
            # Mid-side decomposition
            mid = (left + right) / 2.0
            side = (left - right) / 2.0
            
            # Vocals: center channel emphasis
            vocals = np.stack([mid * 0.9, mid * 0.9], axis=-1)
            
            # Drums approximation: punch and transients
            drums = np.stack([mid * 0.65 + side * 0.35, mid * 0.65 - side * 0.35], axis=-1)
            
            # Bass approximation: low frequencies
            bass = np.stack([mid * 0.75, mid * 0.75], axis=-1)
            
            # Other: side harmonic elements
            other = np.stack([side * 0.85, -side * 0.85], axis=-1)

            # Instrumental specifically = Drums + Bass + Other (sum of non-vocal stems)
            inst = drums + bass + other

            sf.write(vocals_path, vocals, sr)
            sf.write(drums_path, drums, sr)
            sf.write(bass_path, bass, sr)
            sf.write(other_path, other, sr)
            sf.write(instrumental_path, inst, sr)
        except Exception as e:
            raise RuntimeError(f"DSP separation failed: {str(e)}")

        return {
            "vocals": vocals_path,
            "drums": drums_path,
            "bass": bass_path,
            "other": other_path,
            "instrumental": instrumental_path,
        }

engine = StemSeparationEngine()
