from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.responses import FileResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles
import uvicorn
import os
import shutil
import uuid
from groq import Groq
from dotenv import load_dotenv
import edge_tts
import asyncio
from faster_whisper import WhisperModel
import moviepy.editor as mp
import moviepy.video.fx.all as vfx

load_dotenv()

# --- Core Logic Functions ---
def generate_script(topic: str) -> str:
    """Generates a video script using the Groq API."""
    print(f"Generating script for: {topic}")
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise ValueError("GROQ_API_KEY not found in environment variables.")

    client = Groq(api_key=api_key)

    system_prompt = """You are a viral shorts script writer. Your goal is to create a script that is between 50 and 60 seconds long.
    The script must have three parts:
    1. A hook: A sentence that grabs the viewer's attention in the first 3 seconds.
    2. The body: 4-5 short, informative paragraphs.
    3. A call to action: A concluding sentence like 'Follow for more!'.
    You must only return the script content, without any titles, scene descriptions, or extra text."""

    chat_completion = client.chat.completions.create(
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"The topic is: {topic}"}
        ],
        model="llama-3.1-8b-instant",
    )

    script = chat_completion.choices[0].message.content
    print(f"Generated Script: {script}")
    return script

async def generate_voiceover(script: str, output_path: str):
    """Generates voiceover from script using Edge TTS."""
    print(f"Generating voiceover at: {output_path}")
    communicate = edge_tts.Communicate(script, "en-US-GuyNeural")
    await communicate.save(output_path)


def generate_subtitles(audio_path: str) -> list:
    """Generates word-level subtitles from an audio file."""
    print(f"Generating subtitles for: {audio_path}")
    model = WhisperModel("tiny.en", device="cpu", compute_type="int8")
    segments, _ = model.transcribe(audio_path, word_timestamps=True)

    all_words = []
    for segment in segments:
        for word in segment.words:
            all_words.append({
                "word": word.word,
                "start": word.start,
                "end": word.end
            })
    print(f"Generated {len(all_words)} subtitle words.")
    return all_words

def assemble_video(video_path: str, audio_path: str, subtitles: list, output_path: str):
    """Assembles the final video with subtitles and audio."""
    print(f"Assembling video to: {output_path}")

    # Load video and audio
    video_clip = mp.VideoFileClip(video_path)
    audio_clip = mp.AudioFileClip(audio_path)

    # Set video duration to audio duration
    video_clip = video_clip.set_duration(audio_clip.duration)

    # Resize and crop to 9:16 aspect ratio
    w, h = video_clip.size
    target_ratio = 9.0 / 16.0
    current_ratio = w / h

    if current_ratio > target_ratio:
        # Wider than target, crop horizontally
        new_w = int(h * target_ratio)
        video_clip = vfx.crop(video_clip, width=new_w, x_center=w/2)
    else:
        # Taller than target, crop vertically
        new_h = int(w / target_ratio)
        video_clip = vfx.crop(video_clip, height=new_h, y_center=h/2)

    video_clip = video_clip.resize(width=1080)


    # Create subtitle clips
    subtitle_clips = []
    for word_info in subtitles:
        text_clip = mp.TextClip(
            word_info['word'].strip(),
            fontsize=70,
            color='white',
            font='Liberation-Sans',
            stroke_color='black',
            stroke_width=3
        )
        text_clip = text_clip.set_start(word_info['start']).set_end(word_info['end'])
        subtitle_clips.append(text_clip)

    # Compose final video
    final_clip = mp.CompositeVideoClip([
        video_clip,
        *subtitle_clips
    ]).set_position('center', 'center')

    final_clip = final_clip.set_audio(audio_clip)
    final_clip.write_videofile(output_path, codec="libx264", audio_codec="aac", fps=24)


# --- FastAPI Application ---
app = FastAPI()

# Mount static files (HTML/CSS/JS)
app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/", response_class=HTMLResponse)
async def read_root():
    with open("static/index.html") as f:
        return HTMLResponse(content=f.read(), status_code=200)

@app.post("/generate")
async def generate_video_endpoint(topic: str = Form(...), video: UploadFile = File(...)):
    # Create a unique ID for this request to avoid file conflicts
    request_id = str(uuid.uuid4())
    temp_dir = f"temp_{request_id}"
    os.makedirs(temp_dir, exist_ok=True)

    upload_path = os.path.join(temp_dir, video.filename)
    audio_path = os.path.join(temp_dir, "voice.mp3")
    output_path = os.path.join("outputs", f"{request_id}.mp4")

    try:
        # Save the uploaded video file
        with open(upload_path, "wb") as buffer:
            shutil.copyfileobj(video.file, buffer)

        # --- CORE LOGIC ---
        # 1. Generate Script from topic
        script_text = generate_script(topic)

        # 2. Generate Voiceover from script
        await generate_voiceover(script_text, audio_path)

        # 3. Generate Subtitles from voiceover
        subtitle_data = generate_subtitles(audio_path)

        # 4. Assemble Video
        assemble_video(upload_path, audio_path, subtitle_data, output_path)

        # Return the final video file
        return FileResponse(output_path, media_type="video/mp4", filename="generated_video.mp4")

    except Exception as e:
        # If anything goes wrong, return an error
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        # Clean up the temporary directory
        if os.path.exists(temp_dir):
            shutil.rmtree(temp_dir)

if __name__ == "__main__":
    # Ensure necessary directories exist
    os.makedirs("outputs", exist_ok=True)
    # Run the server
    uvicorn.run(app, host="0.0.0.0", port=8000)
