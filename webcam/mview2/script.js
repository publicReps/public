const video = document.getElementById('video');
const outputCanvas = document.getElementById('outputCanvas');
const startBtn = document.getElementById('startBtn');
const toggleBtn = document.getElementById('toggleBtn');
const downloadBtn = document.getElementById('downloadBtn');
const imgTitleInput = document.getElementById('imgTitle');
const cameraBtn = document.getElementById('cameraBtn');
const flashBtn = document.getElementById('flashBtn');

let stream = null;
let isPaused = false;
let isFrontCamera = true;
let isFlashOn = false;

// Prevent zoom on input focus (iOS)
const inputs = document.querySelectorAll('input, button');
inputs.forEach(input => {
  input.addEventListener('focus', (e) => {
    if (e.target.tagName === 'INPUT') {
      document.body.style.zoom = "100%";
    }
  });
});

function toggleButton(btn, enabled) {
  btn.disabled = !enabled;
  btn.classList.toggle('btn--disabled', !enabled);
}

// Start camera
startBtn.addEventListener('click', async () => {
  try {
    const constraints = {
      video: {
        facingMode: isFrontCamera ? 'user' : 'environment',
        width: { ideal: 1280 },
        height: { ideal: 720 }
      },
      audio: false
    };
    
    stream = await navigator.mediaDevices.getUserMedia(constraints);
    video.srcObject = stream;

    toggleButton(startBtn, false);
    toggleButton(toggleBtn, true);
    toggleButton(cameraBtn, true);
    toggleButton(flashBtn, true);

    startBtn.textContent = "Camera Started";
  } catch (err) {
    console.error("Camera error:", err);
    alert("Unable to access camera. Please check permissions.");
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
  link.href = outputCanvas.toDataURL("image/jpeg", 0.95);
  link.click();
  imgTitleInput.value = '';
});

// Toggle between front and back camera
cameraBtn.addEventListener('click', async () => {
  if (!stream) return;
  
  // Stop current stream
  stream.getTracks().forEach(track => track.stop());
  
  isFrontCamera = !isFrontCamera;
  isFlashOn = false;
  flashBtn.textContent = "🔦 Flash Off";
  
  try {
    const constraints = {
      video: {
        facingMode: isFrontCamera ? 'user' : 'environment',
        width: { ideal: 1280 },
        height: { ideal: 720 }
      },
      audio: false
    };
    
    stream = await navigator.mediaDevices.getUserMedia(constraints);
    video.srcObject = stream;
    cameraBtn.textContent = isFrontCamera ? "📷 Front" : "📷 Back";
  } catch (err) {
    console.error("Camera switch error:", err);
    alert("Unable to switch camera.");
  }
});

// Toggle flash light
flashBtn.addEventListener('click', async () => {
  if (!stream) return;
  
  const videoTrack = stream.getVideoTracks()[0];
  if (!videoTrack) return;
  
  try {
    isFlashOn = !isFlashOn;
    
    // Try standard torch API
    try {
      await videoTrack.applyConstraints({
        advanced: [{ torch: isFlashOn }]
      });
      flashBtn.textContent = isFlashOn ? "🔦 Flash On" : "🔦 Flash Off";
      console.log("Flash toggled using torch API");
      return;
    } catch (e) {
      console.log("Torch API not supported, trying alternative...");
    }
    
    // Try using getCapabilities (for some browsers)
    if (videoTrack.getCapabilities) {
      const capabilities = videoTrack.getCapabilities();
      if (capabilities.torch) {
        await videoTrack.applyConstraints({
          advanced: [{ torch: isFlashOn }]
        });
        flashBtn.textContent = isFlashOn ? "🔦 Flash On" : "🔦 Flash Off";
        console.log("Flash toggled using capabilities");
        return;
      }
    }
    
    // If torch not supported, show message
    isFlashOn = !isFlashOn; // Reset state
    alert("Flashlight is not supported on this device or browser.");
    flashBtn.textContent = "🔦 Flash Off";
    
  } catch (err) {
    console.error("Flash toggle error:", err);
    isFlashOn = !isFlashOn; // Reset state
    alert("Unable to toggle flash: " + err.message);
    flashBtn.textContent = "🔦 Flash Off";
  }
});

// Handle page visibility (pause video when app goes to background)
document.addEventListener('visibilitychange', () => {
  if (document.hidden && stream && !isPaused) {
    stream.getTracks().forEach(track => track.enabled = false);
  } else if (!document.hidden && stream) {
    stream.getTracks().forEach(track => track.enabled = true);
  }
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  if (stream) {
    stream.getTracks().forEach(track => track.stop());
  }
});
