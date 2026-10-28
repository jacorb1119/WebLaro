const canvas = document.querySelector("#game-canvas");
const context = canvas.getContext("2d");
const scoreElement = document.querySelector("#score");
const bestScoreElement = document.querySelector("#best-score");
const statusElement = document.querySelector("#game-status");
const overlay = document.querySelector("#game-overlay");
const overlayIcon = document.querySelector("#overlay-icon");
const overlayTitle = document.querySelector("#overlay-title");
const overlayMessage = document.querySelector("#overlay-message");
const playButton = document.querySelector("#play-button");

const width = canvas.width;
const height = canvas.height;
const groundHeight = 62;
const pipeWidth = 62;
const pipeGap = 153;
const bird = { x: 92, y: 250, velocity: 0, radius: 15, rotation: 0 };

let pipes = [];
let score = 0;
let bestScore = 0;
let gameState = "ready";
let animationFrame = 0;
let previousTime = 0;
let groundOffset = 0;

function roundedRect(x, y, rectWidth, rectHeight, radius) {
  context.beginPath();
  context.roundRect(x, y, rectWidth, rectHeight, radius);
  context.fill();
}

function drawBackground() {
  const sky = context.createLinearGradient(0, 0, 0, height);
  sky.addColorStop(0, "#bde6ff");
  sky.addColorStop(1, "#edf9ff");
  context.fillStyle = sky;
  context.fillRect(0, 0, width, height);

  context.fillStyle = "rgb(255 255 255 / 68%)";
  [
    [42, 105, 25],
    [250, 177, 19],
    [307, 74, 15],
  ].forEach(([x, y, radius]) => {
    context.beginPath();
    context.arc(x, y, radius, 0, Math.PI * 2);
    context.arc(x + radius, y - 5, radius * 0.8, 0, Math.PI * 2);
    context.arc(x + radius * 1.8, y, radius * 0.9, 0, Math.PI * 2);
    context.fill();
  });

  context.fillStyle = "#b4dcae";
  context.beginPath();
  context.moveTo(0, height - groundHeight);
  context.quadraticCurveTo(95, height - groundHeight - 92, 195, height - groundHeight);
  context.quadraticCurveTo(280, height - groundHeight - 66, width, height - groundHeight);
  context.lineTo(width, height);
  context.lineTo(0, height);
  context.fill();
}

function drawPipes() {
  pipes.forEach((pipe) => {
    const bottomY = pipe.gapY + pipeGap / 2;
    const topHeight = pipe.gapY - pipeGap / 2;
    const bottomHeight = height - groundHeight - bottomY;
    const gradient = context.createLinearGradient(pipe.x, 0, pipe.x + pipeWidth, 0);
    gradient.addColorStop(0, "#69b85c");
    gradient.addColorStop(0.5, "#91d96e");
    gradient.addColorStop(1, "#55a94d");
    context.fillStyle = gradient;
    roundedRect(pipe.x + 5, 0, pipeWidth - 10, topHeight, 7);
    roundedRect(pipe.x, topHeight - 19, pipeWidth, 19, 5);
    roundedRect(pipe.x + 5, bottomY, pipeWidth - 10, bottomHeight, 7);
    roundedRect(pipe.x, bottomY, pipeWidth, 19, 5);

    context.fillStyle = "rgb(255 255 255 / 18%)";
    context.fillRect(pipe.x + 11, 0, 5, Math.max(0, topHeight - 19));
    context.fillRect(pipe.x + 11, bottomY + 19, 5, Math.max(0, bottomHeight - 19));
  });
}

function drawGround() {
  context.fillStyle = "#e7d49c";
  context.fillRect(0, height - groundHeight, width, groundHeight);
  context.fillStyle = "#8fcf68";
  context.fillRect(0, height - groundHeight, width, 13);
  context.fillStyle = "#b4e17d";
  for (let x = -(groundOffset % 28); x < width; x += 28) {
    context.fillRect(x, height - groundHeight + 13, 14, 5);
  }
  context.fillStyle = "rgb(149 116 67 / 24%)";
  for (let x = -(groundOffset % 37); x < width; x += 37) {
    context.fillRect(x, height - 19, 17, 3);
  }
}

function drawBird() {
  context.save();
  context.translate(bird.x, bird.y);
  context.rotate(bird.rotation);

  context.fillStyle = "#f4b83f";
  context.beginPath();
  context.ellipse(0, 0, bird.radius + 3, bird.radius, 0, 0, Math.PI * 2);
  context.fill();
  context.strokeStyle = "#9c6c2d";
  context.lineWidth = 2;
  context.stroke();

  context.fillStyle = "#ffda69";
  context.beginPath();
  context.ellipse(-5, 5 + Math.sin(bird.velocity) * 2, 8, 5, -0.25, 0, Math.PI * 2);
  context.fill();

  context.fillStyle = "#fff";
  context.beginPath();
  context.arc(7, -6, 5.5, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = "#272a25";
  context.beginPath();
  context.arc(9, -6, 2.4, 0, Math.PI * 2);
  context.fill();

  context.fillStyle = "#ed7954";
  context.beginPath();
  context.moveTo(12, 0);
  context.lineTo(24, 4);
  context.lineTo(12, 8);
  context.closePath();
  context.fill();
  context.restore();
}

function draw() {
  drawBackground();
  drawPipes();
  drawGround();
  drawBird();
}

function createPipe(x = width + 15) {
  const minGapY = 110;
  const maxGapY = height - groundHeight - 110;
  return {
    x,
    gapY: minGapY + Math.random() * (maxGapY - minGapY),
    scored: false,
  };
}

function startGame() {
  cancelAnimationFrame(animationFrame);
  score = 0;
  pipes = [createPipe(width + 35)];
  bird.y = 255;
  bird.velocity = -320;
  bird.rotation = 0;
  groundOffset = 0;
  previousTime = 0;
  gameState = "playing";
  scoreElement.textContent = score;
  statusElement.textContent = "Keep flying!";
  overlay.hidden = true;
  playButton.innerHTML = 'Restart game <span aria-hidden="true">↻</span>';
  canvas.focus();
  animationFrame = requestAnimationFrame(update);
}

function flap() {
  if (gameState === "ready" || gameState === "over") {
    startGame();
    return;
  }
  bird.velocity = -320;
}

function hitPipe(pipe) {
  const closestX = Math.max(pipe.x, Math.min(bird.x, pipe.x + pipeWidth));
  const topGapEdge = pipe.gapY - pipeGap / 2;
  const bottomGapEdge = pipe.gapY + pipeGap / 2;
  const hitsPipeHorizontally = Math.abs(bird.x - closestX) < bird.radius;
  return (
    hitsPipeHorizontally &&
    (bird.y - bird.radius < topGapEdge || bird.y + bird.radius > bottomGapEdge)
  );
}

function endGame() {
  gameState = "over";
  bestScore = Math.max(bestScore, score);
  bestScoreElement.textContent = bestScore;
  statusElement.textContent = `Game over — you flew ${score} ${score === 1 ? "pipe" : "pipes"}.`;
  overlayIcon.textContent = "💫";
  overlayTitle.textContent = "Nice try!";
  overlayMessage.textContent = `You flew past ${score} ${score === 1 ? "pipe" : "pipes"}. Tap to try again`;
  overlay.hidden = false;
  playButton.innerHTML = 'Try again <span aria-hidden="true">↻</span>';
  draw();
}

function update(time) {
  if (gameState !== "playing") return;
  const delta = previousTime === 0 ? 0 : Math.min((time - previousTime) / 1000, 0.035);
  previousTime = time;

  bird.velocity += 920 * delta;
  bird.y += bird.velocity * delta;
  bird.rotation = Math.min(Math.PI / 3, Math.max(-0.4, bird.velocity / 520));

  const pipeSpeed = 145;
  groundOffset = (groundOffset + pipeSpeed * delta) % 28;
  pipes.forEach((pipe) => {
    pipe.x -= pipeSpeed * delta;
    if (!pipe.scored && pipe.x + pipeWidth < bird.x) {
      pipe.scored = true;
      score += 1;
      scoreElement.textContent = score;
      statusElement.textContent = `Score: ${score}`;
    }
  });
  pipes = pipes.filter((pipe) => pipe.x + pipeWidth > -5);
  if (pipes.length === 0 || pipes[pipes.length - 1].x < width - 190) {
    pipes.push(createPipe());
  }

  const groundCollision = bird.y + bird.radius >= height - groundHeight;
  const ceilingCollision = bird.y - bird.radius <= 0;
  const pipeCollision = pipes.some(hitPipe);

  if (groundCollision || ceilingCollision || pipeCollision) {
    endGame();
    return;
  }

  draw();
  animationFrame = requestAnimationFrame(update);
}

function handleKeyDown(event) {
  if (event.code === "Space" || event.code === "ArrowUp") {
    event.preventDefault();
    flap();
  }
}

canvas.addEventListener("pointerdown", (event) => {
  event.preventDefault();
  flap();
});
playButton.addEventListener("click", startGame);
document.addEventListener("keydown", handleKeyDown);

draw();
