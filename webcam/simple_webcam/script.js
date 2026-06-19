const video = document.getElementById('video');
const outputCanvas = document.getElementById('outputCanvas');
const startBtn = document.getElementById('startBtn');
const toggleBtn = document.getElementById('toggleBtn');
const downloadBtn = document.getElementById('downloadBtn');
const imgTitleInput = document.getElementById('imgTitle');

let stream = null;
let isPaused = false;

function toggleButton(btn, enabled) {
  btn.disabled = !enabled;
  btn.classList.toggle('btn--disabled', !enabled);
}

// Start camera
startBtn.addEventListener('click', async () => {
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: true });
    video.srcObject = stream;

    toggleButton(startBtn, false);
    toggleButton(toggleBtn, true);

    startBtn.textContent = "Camera Started";
  } catch (err) {
    console.error("Camera error:", err);
    alert("Unable to access camera!");
  }
});

// Pause/Resume camera
toggleBtn.addEventListener('click', () => {
  if (!stream) return;

  const ctx = outputCanvas.getContext('2d');

  if (!isPaused) {
    // Pause: capture current frame
    outputCanvas.width = video.videoWidth;
    outputCanvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, outputCanvas.width, outputCanvas.height);

    // Hide video and show still image (both centered)
    video.style.visibility = "hidden";
    outputCanvas.style.display = "block";

    toggleBtn.textContent = "Resume";
    toggleButton(downloadBtn, true);
    isPaused = true;
  } else {
    // Resume: show live video again
    video.style.visibility = "visible";
    outputCanvas.style.display = "none";

    toggleBtn.textContent = "Pause";
    toggleButton(downloadBtn, false);
    isPaused = false;
  }
});

// Download captured image
downloadBtn.addEventListener('click', () => {
  if (!isPaused) return alert("Pause camera first to capture image!");

  const title = imgTitleInput.value.trim() || "photo";
  const link = document.createElement('a');
  link.download = `${title}.jpg`;
  link.href = outputCanvas.toDataURL("image/png", 1.0);
  link.click();
  imgTitleInput.value = '';
});
