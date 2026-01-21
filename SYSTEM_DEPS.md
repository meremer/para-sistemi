# System Dependencies Guide

This guide outlines the necessary system-level dependencies that need to be installed before running the AI Viral Shorts Generator.

## 1. FFmpeg

FFmpeg is a critical dependency for video and audio processing. It's used by `moviepy` to compose the final video.

### macOS (using Homebrew)

```bash
brew install ffmpeg
```

### Ubuntu/Debian

```bash
sudo apt update && sudo apt install ffmpeg
```

### Windows (using Chocolatey)

```bash
choco install ffmpeg
```

After installation, ensure the `ffmpeg` command is available in your system's PATH. You can verify this by running:
```bash
ffmpeg -version
```

## 2. Ollama

Ollama is used to run the local Large Language Model (e.g., Mistral 7B) for content generation and optimization tasks.

Follow the official installation instructions on the Ollama website: [https://ollama.ai/](https://ollama.ai/)

After installing Ollama, you need to pull the desired model. For this project, we recommend **Mistral 7B**.

```bash
ollama pull mistral
```

You can verify that the Ollama server is running and the model is available by listing the local models:

```bash
ollama list
```

## 3. CUDA (for NVIDIA GPUs)

If you have an NVIDIA GPU, installing the CUDA Toolkit is essential for hardware acceleration, which is crucial for running the video generation and other AI models efficiently.

1.  **NVIDIA Driver:** Ensure you have the latest NVIDIA driver installed for your GPU.
2.  **CUDA Toolkit:** Download and install the CUDA Toolkit version that is compatible with your driver and the project's dependencies (e.g., PyTorch). Refer to the official NVIDIA website for instructions: [https://developer.nvidia.com/cuda-toolkit](https://developer.nvidia.com/cuda-toolkit)

After installation, the `nvcc` compiler should be in your PATH. You can verify the installation with:
```bash
nvcc --version
```
