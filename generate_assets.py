import os
import time
from pathlib import Path
from dotenv import load_dotenv
from google import genai
from PIL import Image
from io import BytesIO

# === 1) Load environment ===
load_dotenv()
API_KEY = os.getenv("GOOGLE_API_KEY")
if not API_KEY:
    raise ValueError("Missing GOOGLE_API_KEY in .env")

client = genai.Client(api_key=API_KEY)
OUTPUT_DIR = Path("assets/scenes")
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

# === 2) Define scenes ===
SCENES = [
    {
        "id": "scene_01_gates",
        "image_prompt": "spooky haunted house on a hill, foggy night, iron gates, cinematic lighting, gothic style",
        "video_prompt": "fog slowly rolling, iron gate creaking open slightly, subtle camera push-in"
    },
    {
        "id": "scene_02_foyer",
        "image_prompt": "grand dusty foyer, candlelit chandelier, moonbeam through cracked window, staircase center",
        "video_prompt": "dust motes drifting, candlelight flicker, faint camera tilt"
    },
    {
        "id": "scene_03_backdoor",
        "image_prompt": "overgrown garden path, vines, wooden backdoor half hidden in ivy, night fog",
        "video_prompt": "fog swirling, leaves rustling gently"
    },
    {
        "id": "scene_04_cellar",
        "image_prompt": "stone cellar door, wooden steps leading down, dim lantern glow, damp air",
        "video_prompt": "lantern sway, light flicker, faint mist rising"
    },
    {
        "id": "scene_05_upstairs",
        "image_prompt": "long corridor, creaky floorboards, portraits watching, single open door at end",
        "video_prompt": "flickering light from door, slight camera zoom"
    },
]

# === 3) Generate image using Gemini 2.5 Flash Image ===
def generate_image(scene_id: str, prompt: str) -> Path:
    print(f"[gemini] Generating image for {scene_id} …")
    response = client.models.generate_content(
        model="gemini-2.5-flash-image",
        contents=[prompt],
    )

    for part in response.candidates[0].content.parts:
        if part.inline_data is not None:
            image = Image.open(BytesIO(part.inline_data.data))
            img_path = OUTPUT_DIR / f"{scene_id}.png"
            image.save(img_path)
            return img_path

    raise RuntimeError(f"No image data returned for {scene_id}")

# === 4) Generate video using Veo 3.1 ===
def generate_video(scene_id: str, prompt: str, image_path: Path) -> Path:
    print(f"[veo3] Generating animation for {scene_id} …")
    operation = client.models.generate_videos(
        model="veo-3.1-generate-preview",
        prompt=f"{prompt}. Use {image_path} as visual reference.",
    )

    # Poll until done
    while not operation.done:
        print("  ⏳ Waiting for video generation to complete…")
        time.sleep(15)
        operation = client.operations.get(operation)

    generated_video = operation.response.generated_videos[0]
    client.files.download(file=generated_video.video)

    video_path = OUTPUT_DIR / f"{scene_id}.mp4"
    generated_video.video.save(video_path)
    print(f"  ✅ Saved video to {video_path}")
    return video_path

# === 5) Main ===
def main():
    for scene in SCENES:
        try:
            img = generate_image(scene["id"], scene["image_prompt"])
            vid = generate_video(scene["id"], scene["video_prompt"], img)
        except Exception as e:
            print(f"❌ Error on {scene['id']}: {e}")

    print("\n🎬 All assets ready in assets/scenes/")

if __name__ == "__main__":
    main()
