// State management
const state = {
  originalImage: null,
  currentImage: null,
  cropShape: "rectangle",
  aspectRatioLocked: true,
  originalAspectRatio: 1,
  canvas: null,
  ctx: null,
  offsetX: 0,
  offsetY: 0,
  isDragging: false,
  dragStartX: 0,
  dragStartY: 0,
};

// DOM elements
const uploadArea = document.getElementById("uploadArea");
const fileInput = document.getElementById("fileInput");
const selectFileBtn = document.getElementById("selectFileBtn");
const controlsSection = document.getElementById("controlsSection");
const canvasSection = document.getElementById("canvasSection");
const actionsSection = document.getElementById("actionsSection");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const widthInput = document.getElementById("widthInput");
const heightInput = document.getElementById("heightInput");
const aspectRatioToggle = document.getElementById("aspectRatioToggle");
const cropButtons = document.querySelectorAll(".toggle-btn[data-crop]");
const downloadBtn = document.getElementById("downloadBtn");
const resetBtn = document.getElementById("resetBtn");

state.canvas = canvas;
state.ctx = ctx;

// Initialize event listeners
function init() {
  // File input events
  selectFileBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    fileInput.click();
  });
  fileInput.addEventListener("change", handleFileSelect);

  // Drag and drop events
  uploadArea.addEventListener("click", () => fileInput.click());
  uploadArea.addEventListener("dragover", handleDragOver);
  uploadArea.addEventListener("dragleave", handleDragLeave);
  uploadArea.addEventListener("drop", handleDrop);

  // Resize controls
  widthInput.addEventListener("input", handleWidthChange);
  heightInput.addEventListener("input", handleHeightChange);
  aspectRatioToggle.addEventListener("change", handleAspectRatioToggle);

  // Crop controls
  cropButtons.forEach((btn) => {
    btn.addEventListener("click", handleCropChange);
  });

  // Action buttons
  downloadBtn.addEventListener("click", handleDownload);
  resetBtn.addEventListener("click", handleReset);

  // Canvas drag events
  canvas.addEventListener("mousedown", handleCanvasMouseDown);
  canvas.addEventListener("mousemove", handleCanvasMouseMove);
  canvas.addEventListener("mouseup", handleCanvasMouseUp);
  canvas.addEventListener("mouseleave", handleCanvasMouseUp);
  canvas.style.cursor = "grab";
}

// File handling functions
function handleFileSelect(e) {
  const file = e.target.files[0];
  if (file && file.type.startsWith("image/")) {
    loadImage(file);
  }
}

function handleDragOver(e) {
  e.preventDefault();
  e.stopPropagation();
  uploadArea.classList.add("dragover");
}

function handleDragLeave(e) {
  e.preventDefault();
  e.stopPropagation();
  uploadArea.classList.remove("dragover");
}

function handleDrop(e) {
  e.preventDefault();
  e.stopPropagation();
  uploadArea.classList.remove("dragover");

  const file = e.dataTransfer.files[0];
  if (file && file.type.startsWith("image/")) {
    loadImage(file);
  }
}

function loadImage(file) {
  const reader = new FileReader();
  reader.onload = function (e) {
    const img = new Image();
    img.onload = function () {
      state.originalImage = img;
      state.currentImage = img;
      state.originalAspectRatio = img.width / img.height;

      // Reset offsets
      state.offsetX = 0;
      state.offsetY = 0;

      // Initialize dimensions
      widthInput.value = img.width;
      heightInput.value = img.height;

      // Show controls and canvas
      uploadArea.style.display = "none";
      controlsSection.style.display = "grid";
      canvasSection.style.display = "block";
      actionsSection.style.display = "flex";

      // Draw initial image
      updateCanvas();
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

// Resize handling
function handleWidthChange(e) {
  const newWidth = parseInt(e.target.value);
  if (isNaN(newWidth) || newWidth < 1) return;

  if (state.aspectRatioLocked) {
    const newHeight = Math.round(newWidth / state.originalAspectRatio);
    heightInput.value = newHeight;
  }

  updateCanvas();
}

function handleHeightChange(e) {
  const newHeight = parseInt(e.target.value);
  if (isNaN(newHeight) || newHeight < 1) return;

  if (state.aspectRatioLocked) {
    const newWidth = Math.round(newHeight * state.originalAspectRatio);
    widthInput.value = newWidth;
  }

  updateCanvas();
}

function handleAspectRatioToggle(e) {
  state.aspectRatioLocked = e.target.checked;
}

// Canvas drag handling
function handleCanvasMouseDown(e) {
  state.isDragging = true;
  state.dragStartX = e.offsetX - state.offsetX;
  state.dragStartY = e.offsetY - state.offsetY;
  canvas.style.cursor = "grabbing";
}

function handleCanvasMouseMove(e) {
  if (!state.isDragging) return;

  state.offsetX = e.offsetX - state.dragStartX;
  state.offsetY = e.offsetY - state.dragStartY;
  updateCanvas();
}

function handleCanvasMouseUp() {
  state.isDragging = false;
  canvas.style.cursor = "grab";
}

// Crop handling
function handleCropChange(e) {
  const btn = e.currentTarget;
  const cropType = btn.dataset.crop;

  // Update button states
  cropButtons.forEach((b) => b.classList.remove("active"));
  btn.classList.add("active");

  // Update state
  state.cropShape = cropType;

  // Redraw canvas
  updateCanvas();
}

// Canvas rendering
function updateCanvas() {
  const width = parseInt(widthInput.value) || state.originalImage.width;
  const height = parseInt(heightInput.value) || state.originalImage.height;

  if (state.cropShape === "circle") {
    // For circle crop, maintain the specified dimensions
    canvas.width = width;
    canvas.height = height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw the full image first with offset
    ctx.drawImage(
      state.originalImage,
      state.offsetX,
      state.offsetY,
      width,
      height
    );

    // Create semi-transparent overlay for area outside circle
    const radius = Math.min(width, height) / 2;

    // Save the current state
    ctx.save();

    // Clip to circle area
    ctx.beginPath();
    ctx.arc(width / 2, height / 2, radius, 0, Math.PI * 2);
    ctx.clip();

    // Restore to remove clip
    ctx.restore();

    // Now draw overlay outside the circle
    // Use a path that covers everything except the circle
    ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
    ctx.beginPath();
    ctx.rect(0, 0, width, height);
    ctx.arc(width / 2, height / 2, radius, 0, Math.PI * 2, true);
    ctx.fill("evenodd");

    // Draw circle outline
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(width / 2, height / 2, radius, 0, Math.PI * 2);
    ctx.stroke();
  } else {
    // Rectangle crop
    canvas.width = width;
    canvas.height = height;

    // Clear and draw image with offset
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(
      state.originalImage,
      state.offsetX,
      state.offsetY,
      width,
      height
    );
  }
}

// Download handling
function handleDownload() {
  // Create a temporary canvas for download without overlay
  const tempCanvas = document.createElement("canvas");
  const tempCtx = tempCanvas.getContext("2d");
  const width = parseInt(widthInput.value) || state.originalImage.width;
  const height = parseInt(heightInput.value) || state.originalImage.height;

  if (state.cropShape === "circle") {
    // For circle, make canvas size equal to the diameter (smallest dimension)
    const diameter = Math.min(width, height);
    const radius = diameter / 2;

    tempCanvas.width = diameter;
    tempCanvas.height = diameter;

    // Calculate the position to draw the image so the circle is centered
    const sourceRadius = Math.min(width, height) / 2;
    const sourceX = state.offsetX + (width / 2 - sourceRadius);
    const sourceY = state.offsetY + (height / 2 - sourceRadius);

    // Draw the portion of the image that will be in the circle
    tempCtx.drawImage(
      state.originalImage,
      sourceX,
      sourceY,
      diameter,
      diameter,
      0,
      0,
      diameter,
      diameter
    );

    // Create circular mask
    tempCtx.globalCompositeOperation = "destination-in";
    tempCtx.beginPath();
    tempCtx.arc(radius, radius, radius, 0, Math.PI * 2);
    tempCtx.fill();
  } else {
    tempCanvas.width = width;
    tempCanvas.height = height;

    // Rectangle crop - draw image with offset
    tempCtx.drawImage(
      state.originalImage,
      state.offsetX,
      state.offsetY,
      width,
      height
    );
  }

  // Create download link
  const link = document.createElement("a");
  const timestamp = new Date().getTime();
  link.download = `image-${state.cropShape}-${timestamp}.png`;
  link.href = tempCanvas.toDataURL("image/png");
  link.click();
}

// Reset handling
function handleReset() {
  // Reset state
  state.originalImage = null;
  state.currentImage = null;
  state.cropShape = "rectangle";
  state.aspectRatioLocked = true;
  state.offsetX = 0;
  state.offsetY = 0;
  state.isDragging = false;

  // Reset UI
  uploadArea.style.display = "block";
  controlsSection.style.display = "none";
  canvasSection.style.display = "none";
  actionsSection.style.display = "none";

  // Reset controls
  fileInput.value = "";
  widthInput.value = "";
  heightInput.value = "";
  aspectRatioToggle.checked = true;

  // Reset crop buttons
  cropButtons.forEach((btn) => {
    btn.classList.remove("active");
    if (btn.dataset.crop === "rectangle") {
      btn.classList.add("active");
    }
  });

  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

// Initialize the application
init();
