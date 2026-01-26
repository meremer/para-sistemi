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
from moviepy.config import change_settings
from PIL import Image, ImageDraw, ImageFont
import numpy as np

# --- IMPORTANT CONFIGURATION FOR WINDOWS USERS ---
# If you are on Windows and the program fails with a "[WinError 2]" message,
# it means MoviePy cannot find the ImageMagick program.
# 1. Find the full path to the 'magick.exe' file on your system.
#    (e.g., r"C:\Program Files\ImageMagick-7.1.1-Q16-HDRI\magick.exe")
# 2. Paste the path below, replacing the empty string.
IMAGEMAGICK_BINARY_PATH = r"C:\Program Files\ImageMagick-7.1.2-Q16-HDRI\magick.exe"
if IMAGEMAGICK_BINARY_PATH:
    print(f"Using custom ImageMagick path: {IMAGEMAGICK_BINARY_PATH}")
    change_settings({"IMAGEMAGICK_BINARY": IMAGEMAGICK_BINARY_PATH})
# ---------------------------------------------------

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
    """Generates sentence-level subtitles from an audio file."""
    print(f"Generating subtitles for: {audio_path}")
    # Using a larger model for more accurate sentence segmentation
    model = WhisperModel("base.en", device="cpu", compute_type="int8")
    segments, _ = model.transcribe(audio_path, word_timestamps=True)

    sentences = []
    for segment in segments:
        sentence_words = []
        for word in segment.words:
            sentence_words.append({
                "word": word.word.strip(),
                "start": word.start,
                "end": word.end
            })

        if sentence_words:
            sentences.append({
                "sentence": segment.text.strip(),
                "start": segment.start,
                "end": segment.end,
                "words": sentence_words
            })

    print(f"Generated {len(sentences)} sentences.")
    return sentences

def create_subtitle_image(sentence, active_word_index, video_size):
    """Creates a subtitle image with a highlighted active word."""
    # --- Configuration ---
    font_path = "/app/assets/Inter-ExtraBold.ttf"
    font_size = 110
    text_color = "white"
    highlight_color = "#EF4444"
    bg_color = (0, 0, 0, 255)  # Solid black
    padding = 60
    border_radius = 24
    max_width_percentage = 0.8  # 80% of video width

    video_width, video_height = video_size
    max_text_width = int(video_width * max_width_percentage)

    # --- Font and Text Wrapping ---
    font = ImageFont.truetype(font_path, font_size)
    words = sentence['words']

    lines = []
    current_line = []
    for word_info in words:
        word = word_info['word'].upper()
        # Check width with the new word
        line_width = font.getlength(' '.join(current_line + [word]))
        if line_width > max_text_width:
            lines.append(current_line)
            current_line = [word]
        else:
            current_line.append(word)
    lines.append(current_line)

    # --- Image and Drawing Setup ---
    # Calculate text block size
    line_heights = [font.getbbox( ' '.join(line) )[3] - font.getbbox(' '.join(line))[1] for line in lines]
    text_height = sum(line_heights) + (len(lines) - 1) * int(font_size * 0.2)

    text_width = max(font.getlength(' '.join(line)) for line in lines)

    container_width = int(text_width + padding * 2)
    container_height = int(text_height + padding * 2)

    # Create transparent image
    img = Image.new('RGBA', video_size, (255, 255, 255, 0))
    draw = ImageDraw.Draw(img)

    # --- Draw Background Container ---
    container_x = (video_width - container_width) / 2
    container_y = video_height * 2/3 - container_height / 2  # Lower third

    draw.rounded_rectangle(
        [container_x, container_y, container_x + container_width, container_y + container_height],
        fill=bg_color,
        radius=border_radius
    )

    # --- Draw Text and Highlight ---
    y_text = container_y + padding
    word_count = 0
    for i, line in enumerate(lines):
        line_text = ' '.join(line)
        line_width = font.getlength(line_text)
        x_text = container_x + (container_width - line_width) / 2

        for j, word in enumerate(line):
            word_width = font.getlength(word)

            # Highlight the active word
            if word_count == active_word_index:
                highlight_x = x_text
                highlight_y = y_text - 5  # Small offset for better look
                draw.rounded_rectangle(
                    [highlight_x, highlight_y, highlight_x + word_width, highlight_y + line_heights[i] + 10],
                    fill=highlight_color,
                    radius=10
                )

            # Draw the word
            draw.text((x_text, y_text), word, font=font, fill=text_color)
            x_text += word_width + font.getlength(' ')
            word_count += 1

        y_text += line_heights[i] + int(font_size * 0.2)

    return np.array(img)

def assemble_video(video_path: str, audio_path: str, subtitles: list, output_path: str):
    """Assembles the final video with subtitles and audio."""
    print(f"Assembling video to: {output_path}")
    video_clip = None
    audio_clip = None
    final_clip = None
    try:
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
            new_w = int(h * target_ratio)
            video_clip = vfx.crop(video_clip, width=new_w, x_center=w/2)
        else:
            new_h = int(w / target_ratio)
            video_clip = vfx.crop(video_clip, height=new_h, y_center=h/2)

        video_clip = video_clip.resize(width=1440)

        # Create subtitle clips
        all_subtitle_clips = []
        for sentence in subtitles:
            for i, word_info in enumerate(sentence['words']):
                # Create an image for each word being highlighted
                subtitle_frame = create_subtitle_image(sentence, i, video_clip.size)

                word_clip = mp.ImageClip(subtitle_frame)
                word_clip = word_clip.set_start(word_info['start']).set_duration(word_info['end'] - word_info['start'])
                all_subtitle_clips.append(word_clip)

        # Compose final video
        final_clip = mp.CompositeVideoClip([
            video_clip,
            *all_subtitle_clips
        ])

        final_clip = final_clip.set_audio(audio_clip)
        final_clip.write_videofile(
            output_path,
            codec="libx264",
            audio_codec="aac",
            fps=24,
            bitrate="12M",
            preset="slow"
        )
    finally:
        # Ensure all clips are closed to release file handles
        if video_clip:
            video_clip.close()
        if audio_clip:
            audio_clip.close()
        if final_clip:
            final_clip.close()


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
