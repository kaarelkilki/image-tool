// State management
const state = {
    originalImage: null,
    currentImage: null,
    cropShape: 'rectangle',
    aspectRatioLocked: true,
    originalAspectRatio: 1,
    canvas: null,
    ctx: null
};

// DOM elements
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const selectFileBtn = document.getElementById('selectFileBtn');
const controlsSection = document.getElementById('controlsSection');
const canvasSection = document.getElementById('canvasSection');
const actionsSection = document.getElementById('actionsSection');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const widthInput = document.getElementById('widthInput');
const heightInput = document.getElementById('heightInput');
const aspectRatioToggle = document.getElementById('aspectRatioToggle');
const cropButtons = document.querySelectorAll('.toggle-btn[data-crop]');
const downloadBtn = document.getElementById('downloadBtn');
const resetBtn = document.getElementById('resetBtn');

state.canvas = canvas;
state.ctx = ctx;

// Initialize event listeners
function init() {
    // File input events
    selectFileBtn.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', handleFileSelect);

    // Drag and drop events
    uploadArea.addEventListener('click', () => fileInput.click());
    uploadArea.addEventListener('dragover', handleDragOver);
    uploadArea.addEventListener('dragleave', handleDragLeave);
    uploadArea.addEventListener('drop', handleDrop);

    // Resize controls
    widthInput.addEventListener('input', handleWidthChange);
    heightInput.addEventListener('input', handleHeightChange);
    aspectRatioToggle.addEventListener('change', handleAspectRatioToggle);

    // Crop controls
    cropButtons.forEach(btn => {
        btn.addEventListener('click', handleCropChange);
    });

    // Action buttons
    downloadBtn.addEventListener('click', handleDownload);
    resetBtn.addEventListener('click', handleReset);
}

// File handling functions
function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
        loadImage(file);
    }
}

function handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    uploadArea.classList.add('dragover');
}

function handleDragLeave(e) {
    e.preventDefault();
    e.stopPropagation();
    uploadArea.classList.remove('dragover');
}

function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    uploadArea.classList.remove('dragover');

    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
        loadImage(file);
    }
}

function loadImage(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        const img = new Image();
        img.onload = function() {
            state.originalImage = img;
            state.currentImage = img;
            state.originalAspectRatio = img.width / img.height;

            // Initialize dimensions
            widthInput.value = img.width;
            heightInput.value = img.height;

            // Show controls and canvas
            uploadArea.style.display = 'none';
            controlsSection.style.display = 'grid';
            canvasSection.style.display = 'block';
            actionsSection.style.display = 'flex';

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

// Crop handling
function handleCropChange(e) {
    const btn = e.currentTarget;
    const cropType = btn.dataset.crop;

    // Update button states
    cropButtons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    // Update state
    state.cropShape = cropType;

    // Redraw canvas
    updateCanvas();
}

// Canvas rendering
function updateCanvas() {
    const width = parseInt(widthInput.value) || state.originalImage.width;
    const height = parseInt(heightInput.value) || state.originalImage.height;

    if (state.cropShape === 'circle') {
        // For circle crop, use the smaller dimension as the diameter
        const size = Math.min(width, height);
        canvas.width = size;
        canvas.height = size;

        // Clear canvas
        ctx.clearRect(0, 0, size, size);

        // Create circular clipping path
        ctx.save();
        ctx.beginPath();
        ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();

        // Draw image within circular clip
        ctx.drawImage(state.originalImage, 0, 0, size, size);
        ctx.restore();
    } else {
        // Rectangle crop
        canvas.width = width;
        canvas.height = height;

        // Clear and draw image
        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(state.originalImage, 0, 0, width, height);
    }
}

// Download handling
function handleDownload() {
    // Create a download link
    const link = document.createElement('a');
    const timestamp = new Date().getTime();
    link.download = `image-${state.cropShape}-${timestamp}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
}

// Reset handling
function handleReset() {
    // Reset state
    state.originalImage = null;
    state.currentImage = null;
    state.cropShape = 'rectangle';
    state.aspectRatioLocked = true;

    // Reset UI
    uploadArea.style.display = 'block';
    controlsSection.style.display = 'none';
    canvasSection.style.display = 'none';
    actionsSection.style.display = 'none';

    // Reset controls
    fileInput.value = '';
    widthInput.value = '';
    heightInput.value = '';
    aspectRatioToggle.checked = true;

    // Reset crop buttons
    cropButtons.forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.crop === 'rectangle') {
            btn.classList.add('active');
        }
    });

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

// Initialize the application
init();
