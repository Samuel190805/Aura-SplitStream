import os
import uuid
import base64
import shutil
from pathlib import Path
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel
from typing import Optional

from engine import engine

app = FastAPI(
    title="SplitStream Separation Microservice",
    version="1.0.0",
    description="High-performance deep learning source separation API wrapping Demucs/Spleeter"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

TEMP_DIR = Path("./tmp_microservice")
TEMP_DIR.mkdir(parents=True, exist_ok=True)

@app.get("/health")
def health_check():
    return {
        "status": "online",
        "service": "SplitStream Source Separation Engine",
        "device": engine.device,
        "model": engine.model_name,
        "torch_loaded": engine.model is not None,
    }

@app.get("/api/models")
def list_models():
    return {
        "models": [
            {"id": "htdemucs", "name": "Demucs v4 (Hybrid Transformer)", "stems": 4},
            {"id": "htdemucs_6s", "name": "Demucs v4 (6-Stem Guitar/Piano)", "stems": 6},
            {"id": "spleeter", "name": "Spleeter (Deezer)", "stems": 4},
        ],
        "default": "htdemucs",
    }

@app.post("/api/separate")
async def separate_audio(
    file: UploadFile = File(...),
    model: Optional[str] = Form("htdemucs"),
    output_format: Optional[str] = Form("wav"),
):
    job_id = str(uuid.uuid4())
    job_dir = TEMP_DIR / job_id
    job_dir.mkdir(parents=True, exist_ok=True)

    input_file_path = job_dir / f"input_{file.filename}"
    with open(input_file_path, "wb") as f:
        content = await file.read()
        f.write(content)

    output_stems_dir = job_dir / "stems"
    output_stems_dir.mkdir(parents=True, exist_ok=True)

    try:
        results = engine.separate_audio_file(str(input_file_path), str(output_stems_dir))
        
        # Read stems into base64 or serve direct paths
        encoded_stems = {}
        for stem_name, file_path in results.items():
            if os.path.exists(file_path):
                with open(file_path, "rb") as sf:
                    b64 = base64.b64encode(sf.read()).decode("utf-8")
                    encoded_stems[stem_name] = f"data:audio/wav;base64,{b64}"

        return {
            "job_id": job_id,
            "status": "completed",
            "model": "Demucs v4 (Hybrid Transformer)",
            "stems": encoded_stems,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Separation failed: {str(e)}")

@app.get("/api/stems/{job_id}/{stem_name}")
def download_stem(job_id: str, stem_name: str):
    stem_file = TEMP_DIR / job_id / "stems" / f"{stem_name}.wav"
    if not stem_file.exists():
        raise HTTPException(status_code=404, detail="Stem file not found")
    return FileResponse(stem_file, media_type="audio/wav", filename=f"{stem_name}.wav")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
