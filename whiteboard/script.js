const canvas = document.querySelector("#drawing-canvas");
const context = canvas.getContext("2d");
const colorButtons = [...document.querySelectorAll(".color-swatch")];
const customColorInput = document.querySelector("#custom-color");
const brushSizeInput = document.querySelector("#brush-size");
const sizeValue = document.querySelector("#size-value");
const eraserButton = document.querySelector("#eraser-button");
const undoButton = document.querySelector("#undo-button");
const clearButton = document.querySelector("#clear-button");
const saveButton = document.querySelector("#save-button");
const canvasHint = document.querySelector("#canvas-hint");
const drawingCount = document.querySelector("#drawing-count");

const strokes = [];
let currentStroke = null;
let brushColor = "#20231f";
let isErasing = false;

function getCanvasPoint(event) {
  const bounds = canvas.getBoundingClientRect();
  return {
    x: (event.clientX - bounds.left) * (canvas.width / bounds.width),
    y: (event.clientY - bounds.top) * (canvas.height / bounds.height),
  };
}

function drawStroke(stroke) {
  drawStrokeOnContext(context, stroke);
}

function drawStrokeOnContext(targetContext, stroke) {
  if (stroke.points.length === 0) return;

  targetContext.save();
  targetContext.globalCompositeOperation = stroke.erase ? "destination-out" : "source-over";
  targetContext.strokeStyle = stroke.color;
  targetContext.fillStyle = stroke.color;
  targetContext.lineWidth = stroke.size;
  targetContext.lineCap = "round";
  targetContext.lineJoin = "round";

  const [first, ...remaining] = stroke.points;
  if (remaining.length === 0) {
    targetContext.beginPath();
    targetContext.arc(first.x, first.y, stroke.size / 2, 0, Math.PI * 2);
    targetContext.fill();
  } else {
    targetContext.beginPath();
    targetContext.moveTo(first.x, first.y);
    remaining.forEach((point) => targetContext.lineTo(point.x, point.y));
    targetContext.stroke();
  }
  targetContext.restore();
}

function redraw() {
  context.clearRect(0, 0, canvas.width, canvas.height);
  strokes.forEach(drawStroke);
  if (currentStroke) drawStroke(currentStroke);
  canvasHint.classList.toggle("is-hidden", strokes.length > 0 || currentStroke !== null);
  drawingCount.textContent =
    strokes.length === 0 && currentStroke === null
      ? "A fresh page"
      : `${strokes.length + (currentStroke ? 1 : 0)} ${strokes.length + (currentStroke ? 1 : 0) === 1 ? "stroke" : "strokes"}`;
  undoButton.disabled = strokes.length === 0;
}

function resizeCanvas() {
  const bounds = canvas.getBoundingClientRect();
  if (!bounds.width || !bounds.height) return;

  const pixelRatio = window.devicePixelRatio || 1;
  const previousWidth = canvas.width;
  const previousHeight = canvas.height;
  const nextWidth = Math.round(bounds.width * pixelRatio);
  const nextHeight = Math.round(bounds.height * pixelRatio);
  if (canvas.width === nextWidth && canvas.height === nextHeight) return;

  canvas.width = nextWidth;
  canvas.height = nextHeight;
  context.setTransform(1, 0, 0, 1, 0, 0);

  if (previousWidth && previousHeight) {
    const scaleX = nextWidth / previousWidth;
    const scaleY = nextHeight / previousHeight;
    const scaleSize = (scaleX + scaleY) / 2;
    strokes.forEach((stroke) => {
      stroke.points.forEach((point) => {
        point.x *= scaleX;
        point.y *= scaleY;
      });
      stroke.size *= scaleSize;
    });
  }
  redraw();
}

function startStroke(event) {
  if (event.button !== undefined && event.button !== 0) return;
  event.preventDefault();
  canvas.setPointerCapture(event.pointerId);
  const point = getCanvasPoint(event);
  currentStroke = {
    color: brushColor,
    size: Number(brushSizeInput.value) * (canvas.width / canvas.clientWidth),
    erase: isErasing,
    points: [point],
  };
  redraw();
}

function continueStroke(event) {
  if (!currentStroke) return;
  event.preventDefault();
  currentStroke.points.push(getCanvasPoint(event));
  redraw();
}

function finishStroke(event) {
  if (!currentStroke) return;
  if (canvas.hasPointerCapture(event.pointerId)) {
    canvas.releasePointerCapture(event.pointerId);
  }
  strokes.push(currentStroke);
  currentStroke = null;
  redraw();
}

function selectColor(color, selectedButton = null) {
  brushColor = color;
  colorButtons.forEach((button) => {
    const isSelected = button === selectedButton;
    button.classList.toggle("is-selected", isSelected);
    button.setAttribute("aria-pressed", String(isSelected));
  });
  isErasing = false;
  eraserButton.setAttribute("aria-pressed", "false");
  canvas.classList.remove("is-erasing");
}

colorButtons.forEach((button) => {
  button.addEventListener("click", () => selectColor(button.dataset.color, button));
});

customColorInput.addEventListener("input", () => {
  selectColor(customColorInput.value);
});

brushSizeInput.addEventListener("input", () => {
  sizeValue.value = `${brushSizeInput.value} px`;
  sizeValue.textContent = `${brushSizeInput.value} px`;
});

eraserButton.addEventListener("click", () => {
  isErasing = !isErasing;
  eraserButton.setAttribute("aria-pressed", String(isErasing));
  canvas.classList.toggle("is-erasing", isErasing);
});

undoButton.addEventListener("click", () => {
  if (strokes.length === 0) return;
  strokes.pop();
  redraw();
});

clearButton.addEventListener("click", () => {
  if (strokes.length === 0) return;
  strokes.length = 0;
  redraw();
});

saveButton.addEventListener("click", () => {
  const drawingLayer = document.createElement("canvas");
  drawingLayer.width = canvas.width;
  drawingLayer.height = canvas.height;
  const drawingContext = drawingLayer.getContext("2d");
  strokes.forEach((stroke) => drawStrokeOnContext(drawingContext, stroke));

  const image = document.createElement("canvas");
  image.width = canvas.width;
  image.height = canvas.height;
  const imageContext = image.getContext("2d");
  imageContext.fillStyle = "#ffffff";
  imageContext.fillRect(0, 0, image.width, image.height);
  imageContext.drawImage(drawingLayer, 0, 0);

  const link = document.createElement("a");
  link.download = "my-whiteboard.png";
  link.href = image.toDataURL("image/png");
  link.click();
});

canvas.addEventListener("pointerdown", startStroke);
canvas.addEventListener("pointermove", continueStroke);
canvas.addEventListener("pointerup", finishStroke);
canvas.addEventListener("pointercancel", finishStroke);
window.addEventListener("resize", resizeCanvas);
new ResizeObserver(resizeCanvas).observe(canvas);
resizeCanvas();
redraw();
