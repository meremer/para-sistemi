# Local AI Viral Shorts Generator

This project is a Python-based local AI system for generating viral-optimized short videos (15-60 seconds). It takes stories or facts as input, converts them to voiceovers, generates or fetches video footage, and adds captions to produce engaging short videos.

## Features

- **Batch Generation:** Create multiple videos at once from a folder of text files.
- **Auto-Captions:** Automatically generate and overlay captions using a local Whisper model.
- **Viral Optimization:** Tools to enhance videos for better engagement (placeholder).
- **Local First:** All models (TTS, Video, Captions, LLM) run locally, ensuring privacy and no API costs.
- **Optimized for 8GB VRAM:** Configuration and model choices are tailored for consumer-grade GPUs.

## Tech Stack

- **Python:** 3.11+
- **CLI:** Click
- **Video Composition:** FFmpeg + MoviePy
- **LLM:** Ollama + Mistral 7B
- **Text-to-Speech (TTS):** Piper or Coqui (local)
- **Video Generation:** Stable Diffusion XL Turbo or AnimateDiff (local)
- **Captions:** Whisper.cpp (local)

## Directory Structure

```
.
├── models/         # AI model weights
├── input/          # Input stories/facts (text files)
├── output/         # Final generated videos
├── cache/          # Temporary files for generation
├── src/            # Source code
│   ├── generators/   # Modules for content, video, and captions
│   ├── optimizers/   # Modules for viral optimization
│   ├── batch/      # Modules for batch processing
│   └── utils/      # Utility functions
├── main.py         # Main CLI application
├── requirements.txt  # Python dependencies
├── config.py       # Configuration loader
├── .env.template   # Template for environment variables
├── README.md       # This file
└── SYSTEM_DEPS.md  # System-level dependency guide
```

## Setup Instructions

1.  **System Dependencies:** Before setting up the Python environment, ensure you have the necessary system-level dependencies installed. Please refer to the `SYSTEM_DEPS.md` guide.

2.  **Create a Virtual Environment:**
    ```bash
    python3 -m venv .venv
    source .venv/bin/activate
    ```

3.  **Install Python Dependencies:**
    ```bash
    pip install -r requirements.txt
    ```

4.  **Configuration:**
    - Copy the `.env.template` file to a new file named `.env`.
    - Edit the `.env` file to specify the correct paths to your downloaded models and adjust VRAM settings if needed.

5.  **Download Models:**
    - Download the required models (TTS, Video, Captions) and place them in the `/models` directory or the paths specified in your `.env` file.

## Usage

The application is controlled via a command-line interface.

### Generate a Single Video

```bash
python main.py generate --story "Your amazing fact or story goes here."
```

### Batch Generate Videos

1.  Place your stories as individual `.txt` files in the `/input` directory.
2.  Run the batch command:
    ```bash
    python main.py batch --input-dir input --output-dir output
    ```

### Optimize a Video (Placeholder)

```bash
python main.py optimize path/to/your/video.mp4
```
