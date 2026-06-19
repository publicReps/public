const video = document.getElementById('video');
const overlay = document.getElementById('overlay');
const startBtn = document.getElementById('startBtn');
const captureBtn = document.getElementById('captureBtn');
const downloadBtn = document.getElementById('downloadBtn');
const outputCanvas = document.getElementById('outputCanvas');
const imgTitleInput = document.getElementById('imgTitle');

let stream;

Promise.all([
  faceapi.nets.tinyFaceDetector.loadFromUri('realtime_ai_crop/models/'),
  faceapi.nets.faceLandmark68Net.loadFromUri('realtime_ai_crop/models/'),
  faceapi.nets.faceRecognitionNet.loadFromUri('realtime_ai_crop/models/'),
  faceapi.nets.faceExpressionNet.loadFromUri('realtime_ai_crop/models/')
]).then(() => {
  console.log("Models Loaded");
});

startBtn.addEventListener('click', async () => {
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: {} });
    video.srcObject = stream;
    captureBtn.disabled = false;
  } catch (err) {
    console.error(err);
  }
});

video.addEventListener('play', () => {
  overlay.width = video.width;
  overlay.height = video.height;

  const displaySize = { width: video.width, height: video.height };
  faceapi.matchDimensions(overlay, displaySize);

  setInterval(async () => {
    const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks();
    const resized = faceapi.resizeResults(detections, displaySize);
    // const ctx = overlay.getContext('2d');
    const ctx = overlay.getContext('2d', { willReadFrequently: true });
    ctx.clearRect(0, 0, overlay.width, overlay.height);
    faceapi.draw.drawDetections(overlay, resized);
  }, 200);
});
// video.addEventListener('play', () => {
//   overlay.width = video.width;
//   overlay.height = video.height;

//   const displaySize = { width: video.width, height: video.height };
//   faceapi.matchDimensions(overlay, displaySize);

//   const ctx = overlay.getContext('2d');

//   async function detectLoop() {
//     const detection = await faceapi.detectSingleFace(
//       video,
//       new faceapi.TinyFaceDetectorOptions({
//         inputSize: 160,  // lower = faster, try 160 or 128
//         scoreThreshold: 0.5
//       })
//     );

//     ctx.clearRect(0, 0, overlay.width, overlay.height);

//     if (detection) {
//       const resized = faceapi.resizeResults(detection, displaySize);
//       faceapi.draw.drawDetections(overlay, resized);
//     }

//     requestAnimationFrame(detectLoop);
//   }

//   detectLoop();
// });


captureBtn.addEventListener('click', async () => {
  const detections = await faceapi.detectSingleFace(video, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks();

  if (!detections) {
    showToast({ text: 'No face detected. Try again!', duration: 3000, type: 'success' });
    return;
  }

  const box = detections.detection.box;
  const { x, y, width, height } = box;

  // Expand crop area (passport-style)
  // Expand only the top (more head space, no extra chest)
  const expandTop = height * 0.5;  // increase this value (0.4–0.6) for more head area
  const expandSides = width * 0.7; // same side margin
  const expandBottom = height * 0.5; // small chest area only

  const cropX = Math.max(0, x - expandSides / 2);
  const cropY = Math.max(0, y - expandTop);
  const cropWidth = Math.min(video.videoWidth, width + expandSides);
  const cropHeight = Math.min(video.videoHeight, height + expandTop + expandBottom);

  // const expandTop = box.height * 0.6;
  // const expandBottom = box.height * 0.8;
  // const expandSides = box.width * 0.4;
  // const newX = Math.max(0, box.x - expandSides / 2);
  // const newY = Math.max(0, box.y - expandTop / 2);
  // const newWidth = box.width + expandSides;
  // const newHeight = box.height + expandTop + expandBottom;


  outputCanvas.width = 413;  // standard passport width in pixels (approx)
  outputCanvas.height = 531; // standard passport height in pixels (approx)

  const ctx = outputCanvas.getContext('2d');
  ctx.filter = 'brightness(1.1)';
  // ctx.drawImage(video, newX, newY, newWidth, newHeight, 0, 0, outputCanvas.width, outputCanvas.height);
  ctx.drawImage(video, cropX, cropY, cropWidth, cropHeight, 0, 0, outputCanvas.width, outputCanvas.height);

  downloadBtn.disabled = false;
  showToast({ text: 'Photo captured successfully!', duration: 3000, type: 'success' });
});

downloadBtn.addEventListener('click', () => {
  const title = imgTitleInput.value.trim() || "passport_photo";
  const link = document.createElement('a');
  link.download = `${title}.png`;
  link.href = outputCanvas.toDataURL("image/jpeg", 1.0);
  showToast({ text: `${title}.jpg downloaded successfully!`, duration: 3000, type: 'success' });
  link.click();
});

// start, capture, download key listening 
document.addEventListener('keydown', function(event) {
  switch(event.key) {
    case "ArrowLeft":
      startBtn.click();
      event.preventDefault();
      break;
    case "ArrowDown":
      captureBtn.click();
      event.preventDefault();
      break;
    case "ArrowRight":
      downloadBtn.click();
      event.preventDefault();
      break;
    default:
      break;
  }
});

const container = document.getElementById('toastContainer');
const active = new Set();

// toast function
function showToast({ text = '', duration = 3000, type = '' } = {}) {
    // alert("it is working...");
    const toast = document.createElement('div');
    toast.className = 'toast ' + (type || '');
    toast.setAttribute('role', 'status');
    toast.innerHTML = `
        <span class="message">${text}</span>
        <button class="close" aria-label="Close">&times;</button>
    `;

    // close button
    toast.querySelector('.close').addEventListener('click', () => removeToast(toast));

    container.appendChild(toast);

    // Force reflow so transition runs
    void toast.offsetWidth;
    toast.classList.add('show');

    // Hide after duration
    const tid = setTimeout(() => removeToast(toast), duration);
    active.add(tid);

    function removeToast(el) {
        // clear timer if still present
        if (active.has(tid)) {
        clearTimeout(tid);
        active.delete(tid);
        }
        el.classList.remove('show');
        // wait for transition before removing from DOM
        setTimeout(() => {
        if (el.parentNode) el.parentNode.removeChild(el);
        }, 260);
    }
}


