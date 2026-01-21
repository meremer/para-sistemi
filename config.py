# config.py
import os
from dotenv import load_dotenv

# Load environment variables from a .env file
load_dotenv()

# --- Model Paths ---
TTS_MODEL_PATH = os.getenv("TTS_MODEL_PATH", "models/tts/en_US-ljspeech-high.onnx")
VIDEO_MODEL_PATH = os.getenv("VIDEO_MODEL_PATH", "models/video/sd_xl_turbo_1.0.safetensors")
CAPTION_MODEL_PATH = os.getenv("CAPTION_MODEL_PATH", "models/whisper/ggml-base.en.bin")

# --- VRAM Optimization Settings ---
ENABLE_VRAM_OPTIMIZATIONS = os.getenv("ENABLE_VRAM_OPTIMIZATIONS", "True").lower() == "true"
STABLE_DIFFUSION_LOW_VRAM_MODE = os.getenv("STABLE_DIFFUSION_LOW_VRAM_MODE", "True").lower() == "true"

# --- Ollama LLM Settings ---
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "mistral")
