// Accessing the camera and displaying it
const video = document.getElementById('video');
const startButton = document.getElementById('startButton');
const pauseButton = document.getElementById('pauseButton'); // Pause button
const downloadButton = document.getElementById('downloadButton');
const customFileNameInput = document.getElementById('customFileName');

// Start the camera on button click
startButton.addEventListener('click', () => {
  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    navigator.mediaDevices.getUserMedia({ video: true })
      .then((stream) => {
        video.srcObject = stream;
      })
      .catch((err) => {
        console.error("Error accessing camera: ", err);
      });
  }
});

// Pause/Resume the video on button click
pauseButton.addEventListener('click', () => {
  if (video.paused) {
    video.play();
    pauseButton.textContent = 'Pause';
  } else {
    video.pause();
    pauseButton.textContent = 'Resume';
  }
});

// Crop area drag functionality
const cropArea = document.getElementById('crop-area');
let isDragging = false;
let offsetX, offsetY;

cropArea.addEventListener('mousedown', (e) => {
  if (e.target === cropArea || e.target === video) { // Only allow dragging the crop area, not resizing handle
    e.preventDefault();
    isDragging = true;
    offsetX = e.clientX - cropArea.offsetLeft;
    offsetY = e.clientY - cropArea.offsetTop;
  }
});

document.addEventListener('mousemove', (e) => {
  if (isDragging) {
    cropArea.style.left = `${e.clientX - offsetX}px`;
    cropArea.style.top = `${e.clientY - offsetY}px`;
  }
});

document.addEventListener('mouseup', () => {
  isDragging = false;
});

// Resize functionality for crop area
const resizeHandle = document.getElementById('resize-handle');
let isResizing = false;
let startX, startY, startWidth, startHeight;

resizeHandle.addEventListener('mousedown', (e) => {
  e.preventDefault();
  isResizing = true;
  startX = e.clientX;
  startY = e.clientY;
  startWidth = cropArea.offsetWidth;
  startHeight = cropArea.offsetHeight;

  document.addEventListener('mousemove', resizeCropArea);
});

document.addEventListener('mouseup', () => {
  isResizing = false;
  document.removeEventListener('mousemove', resizeCropArea);
});

function resizeCropArea(e) {
  if (isResizing) {
    const newWidth = startWidth + (e.clientX - startX);
    const newHeight = startHeight + (e.clientY - startY);

    // Set minimum dimensions for the crop area
    if (newWidth > 50) cropArea.style.width = `${newWidth}px`;
    if (newHeight > 50) cropArea.style.height = `${newHeight}px`;
  }
}

// Function to capture and download the cropped area
downloadButton.addEventListener('click', () => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  // Get the cropping area's dimensions and position
  const cropAreaRect = cropArea.getBoundingClientRect();
  const videoRect = video.getBoundingClientRect();
  
  // Calculate the scaling factor (how much the video is scaled from its original dimensions)
  const scaleX = video.videoWidth / videoRect.width;  // Scale factor for width
  const scaleY = video.videoHeight / videoRect.height; // Scale factor for height

  // Set the canvas size to match the cropped area
  canvas.width = cropAreaRect.width;
  canvas.height = cropAreaRect.height;

  // Draw the cropped section from the video to the canvas
  ctx.drawImage(
    video,
    (cropAreaRect.left - videoRect.left) * scaleX, // Adjust X position for video scaling
    (cropAreaRect.top - videoRect.top) * scaleY,   // Adjust Y position for video scaling
    cropAreaRect.width * scaleX,                   // Adjust width for video scaling
    cropAreaRect.height * scaleY,                  // Adjust height for video scaling
    0, 0,                                          // Draw starting position on canvas
    cropAreaRect.width,                            // width on canvas
    cropAreaRect.height                            // height on canvas
  );

  // Create a link to trigger the download
  const downloadLink = document.createElement('a');
  const customFileName = customFileNameInput.value || 'cropped_image'; // Default to 'cropped_image' if no custom name
  
  // Set the download file name
  downloadLink.download = `${customFileName}.png`;

  // Convert the canvas to a data URL and set it as the href of the link
  downloadLink.href = canvas.toDataURL('image/png');
  
  // Trigger the download
  downloadLink.click();
});

// input clear function
function clearInput() {
  setTimeout(() => {
    customFileNameInput.value = '';
  }, 1000); 
}