// === AUDIO UNLOCK FIX ===
let audioUnlocked = false;
document.body.addEventListener("click", () => {
  if (!audioUnlocked) {
    const dummy = document.createElement("video");
    dummy.muted = false;
    dummy.play().catch(() => {});
    audioUnlocked = true;
    console.log("🔊 Audio context unlocked");
  }
}, { once: true });

// === STORY MAP ===
const story = {
  "scene_01_gates": {
    video: "assets/scenes/scene_01_gates.mp4",
    text: "You stand before the old Hemlock House. The wind whispers through the trees.",
    choices: [
      { text: "Try the Front Door", nextScene: "scene_02_foyer" },
      { text: "Look for a Back Door", nextScene: "scene_03_backdoor" },
      { text: "Try the Basement Cellar", nextScene: "scene_04_cellar" }
    ]
  },
  "scene_02_foyer": {
    video: "assets/scenes/scene_02_foyer.mp4",
    text: "A dusty foyer stretches before you. A grand staircase looms.",
    choices: [
      { text: "Go Upstairs", nextScene: "scene_05_upstairs" },
      { text: "Go Back", nextScene: "scene_01_gates" }
    ]
  },
  "scene_03_backdoor": {
    video: "assets/scenes/scene_03_backdoor.mp4",
    text: "You find a hidden door behind vines. It creaks open...",
    choices: [
      { text: "Enter Carefully", nextScene: "scene_04_cellar" },
      { text: "Return to the Gates", nextScene: "scene_01_gates" }
    ]
  },
  "scene_04_cellar": {
    video: "assets/scenes/scene_04_cellar.mp4",
    text: "The cellar is damp and cold. You hear a faint whisper.",
    choices: [
      { text: "Investigate the Whisper", nextScene: "scene_05_upstairs" },
      { text: "Run Back Outside", nextScene: "scene_01_gates" }
    ]
  },
  "scene_05_upstairs": {
    video: "assets/scenes/scene_05_upstairs.mp4",
    text: "At the top of the stairs, portraits watch as you approach a flickering door...",
    choices: [
      { text: "Open the Door", nextScene: "scene_01_gates" }
    ]
  }
};

// === ELEMENT REFERENCES ===
const video = document.getElementById("scene-video");
const image = document.getElementById("scene-image");
const text = document.getElementById("scene-text");
const choices = document.getElementById("choices-container");
const hint = document.getElementById("click-hint");

let currentSceneId = null;
let videoRevealed = false;

// === MAIN SCENE LOADER ===
function showScene(id) {
  currentSceneId = id;
  videoRevealed = false;
  const scene = story[id];
  const imagePath = scene.video.replace(".mp4", ".png");

  // Hide video fully before showing next PNG
  video.pause();
  video.classList.remove("active");
  video.style.zIndex = 1; // ensure video stays behind
  video.src = "";

  // Reset image + hint
  image.src = imagePath;
  image.classList.add("active");
  image.style.zIndex = 2; // image on top again
  hint.textContent = "🖱️ Click the image to reveal the scene...";
  hint.style.opacity = 1;

  // Clear choices and show text
  choices.innerHTML = "";
  text.textContent = scene.text;

  // Rebind click handler for new scene
  image.onclick = revealVideo;
}

// === REVEAL CINEMATIC ===
function revealVideo() {
  if (videoRevealed) return;
  videoRevealed = true;

  const scene = story[currentSceneId];
  const imagePath = scene.video.replace(".mp4", ".png");

  // Fade out image hint
  hint.style.opacity = 0;

  // Prepare video
  video.src = scene.video;
  video.poster = imagePath;
  video.muted = false;
  video.style.zIndex = 3; // bring video above image

  video.load();
  video.oncanplay = () => {
    image.classList.remove("active");
    video.classList.add("active");
    video.play().catch(err => console.warn("Playback blocked:", err));
  };

  video.onended = () => {
    video.classList.remove("active"); // hide finished clip
    showChoices();
  };
}

// === SHOW CHOICES AFTER CLIP ===
function showChoices() {
  const scene = story[currentSceneId];
  choices.innerHTML = "";
  scene.choices.forEach(choice => {
    const btn = document.createElement("button");
    btn.textContent = choice.text;
    btn.onclick = () => showScene(choice.nextScene);
    choices.appendChild(btn);
  });
  hint.textContent = "🖱️ Choose your next move...";
  hint.style.opacity = 0.8;
}

// === START GAME ===
showScene("scene_01_gates");
