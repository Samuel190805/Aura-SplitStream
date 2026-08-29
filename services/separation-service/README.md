# SplitStream Separation Microservice

Python FastAPI microservice wrapping Demucs v4 (Hybrid Transformer) and Spleeter for deep-learning multi-stem source separation.

## Setup & Running

1. Create and activate a Python virtual environment:
```bash
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Run the microservice:
```bash
uvicorn main:app --reload --port 8000
```
