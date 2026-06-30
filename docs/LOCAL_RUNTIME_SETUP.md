# Ada Local Runtime Setup Guide

This guide documents the runtime setup and dependency requirements to run the Ada assistant locally on Windows.

---

## Environment Information

- **Python Version**: Python 3.11.15 (Windows x86-64)
- **Virtual Environment Path**: `D:\Projects\ada-jdm\ada\.venv`
- **Activation Command**:
  ```powershell
  cd D:\Projects\ada-jdm\ada
  .\.venv\Scripts\activate
  ```

---

## Installation Summary

To install the full required dependency set from scratch into the virtual environment, run:

1. **Upgrade Core Packaging Tools**:
   ```powershell
   python -m pip install --upgrade pip setuptools wheel
   ```
2. **Install Core Local Ada & Speech Packages**:
   ```powershell
   python -m pip install ollama pyaudio RealtimeSTT RealtimeTTS "realtimetts[system]" pyttsx3 "RealtimeSTT[faster-whisper]"
   ```
3. **Install Audio, STT, and TTS Support**:
   ```powershell
   python -m pip install numpy scipy soundfile torch torchaudio websockets websocket-client
   ```
4. **Install AI / API Services**:
   ```powershell
   python -m pip install pydantic requests python-dotenv google-genai google-generativeai elevenlabs
   ```
5. **Install Vision & Device Support**:
   ```powershell
   python -m pip install pillow opencv-python mss psutil gputil
   ```
6. **Install Test Framework**:
   ```powershell
   python -m pip install pytest
   ```

Alternatively, you can restore all packages using the generated snapshot:
```powershell
python -m pip install -r requirements-local.txt
```

---

## Run Commands

### 1. Daily Run Command (Local Assistant)
Runs the Ollama-based offline vocal assistant:
```powershell
cd D:\Projects\ada-jdm\ada
.\.venv\Scripts\activate
python legacy\main_local.py
```

### 2. Online Lighter Variant (No-ElevenLabs)
Runs the Gemini Live API online assistant using default system TTS voices:
```powershell
cd D:\Projects\ada-jdm\ada
.\.venv\Scripts\activate
python legacy\main_online_noelevenlabs.py
```
> [!IMPORTANT]
> The online variant requires the following API keys to be configured in your environment or a `.env` file in the repository root:
> - `GOOGLE_API_KEY`: Gemini API authorization key
> - `MAPS_API_KEY`: Google Maps calculation authorization key

---

## Service Requirements

### Ollama Setup
The offline assistant (`main_local.py`) requires the Ollama local inference service to be running:
1. Ensure the Ollama Desktop app is started, or start the service from command line:
   ```powershell
   ollama serve
   ```
2. Make sure the instruction model `gemma3:4b-it-q4_K_M` is pulled:
   ```powershell
   ollama pull gemma3:4b-it-q4_K_M
   ```

---

## JDM-OS Bridge Tests

Verify the bridge connection and path safety controls using `pytest`:
```powershell
python -m pytest tests/test_jdm_os_bridge.py
```

---

## Troubleshooting

### 1. PyAudio Installation Failures
On Windows, compiling PyAudio from source can fail if Microsoft Visual C++ Build Tools are missing.
- **Fix**: The precompiled wheels in `.venv` are already installed, but if reinstalling, download the precompiled wheel matching Python 3.11 from unofficial sources or use:
  ```powershell
  python -m pip install pipwin
  pipwin install pyaudio
  ```

### 2. RealtimeTTS / SystemEngine Import Errors
If `SystemEngine` fails to load, it is because `pyttsx3` is missing:
- **Fix**: Run `python -m pip install "realtimetts[system]"` and verify `pyttsx3` installs cleanly. On Windows, ensure SAPI5 is enabled.

### 3. Speech-to-Text Model Downloads
On first execution, `RealtimeSTT` downloads the Hugging Face Whisper `large-v3` model (approx. 3 GB) and the Silero VAD model.
- **Silero VAD Prompt**: When starting the assistant, PyTorch may prompt:
  `Do you trust this repository and wish to add it to the trusted list of repositories (y/N)?`
  Respond with `y` to allow the Silero VAD filters to initialize.
- **Disk Cache Location**: The models are cached under:
  `C:\Users\<user>\.cache\huggingface\hub`
