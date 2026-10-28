const winningLines = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

const cells = [...document.querySelectorAll(".cell")];
const status = document.querySelector("#game-status");
const newRoundButton = document.querySelector("#new-round");
const scoreElements = {
  X: document.querySelector("#score-x"),
  O: document.querySelector("#score-o"),
  draw: document.querySelector("#score-draw"),
};
const scoreCards = {
  X: document.querySelector("#score-card-x"),
  O: document.querySelector("#score-card-o"),
};

let board = Array(9).fill("");
let currentPlayer = "X";
let roundOver = false;
const scores = { X: 0, O: 0, draw: 0 };

function updateTurn() {
  status.textContent = `Player ${currentPlayer}'s turn`;
  scoreCards.X.classList.toggle("is-current", currentPlayer === "X" && !roundOver);
  scoreCards.O.classList.toggle("is-current", currentPlayer === "O" && !roundOver);
}

function finishRound(message, winner, winningLine = []) {
  roundOver = true;
  status.textContent = message;
  scoreCards.X.classList.remove("is-current");
  scoreCards.O.classList.remove("is-current");

  if (winner) {
    scores[winner] += 1;
    winningLine.forEach((index) => cells[index].classList.add("is-winner"));
  } else {
    scores.draw += 1;
  }

  scoreElements.X.textContent = scores.X;
  scoreElements.O.textContent = scores.O;
  scoreElements.draw.textContent = scores.draw;
  cells.forEach((cell) => {
    cell.disabled = true;
  });
  newRoundButton.focus();
}

function handleCellClick(event) {
  const cell = event.currentTarget;
  const index = Number(cell.dataset.cell);
  if (roundOver || board[index]) return;

  board[index] = currentPlayer;
  cell.textContent = currentPlayer;
  cell.classList.add(currentPlayer === "X" ? "mark-x" : "mark-o");
  cell.setAttribute(
    "aria-label",
    `Row ${Math.floor(index / 3) + 1}, column ${(index % 3) + 1}, ${currentPlayer}`,
  );
  cell.disabled = true;

  const winningLine = winningLines.find((line) =>
    line.every((lineIndex) => board[lineIndex] === currentPlayer),
  );

  if (winningLine) {
    finishRound(`Player ${currentPlayer} wins!`, currentPlayer, winningLine);
  } else if (board.every(Boolean)) {
    finishRound("It's a draw! Nice game.");
  } else {
    currentPlayer = currentPlayer === "X" ? "O" : "X";
    updateTurn();
  }
}

function startNewRound() {
  board = Array(9).fill("");
  currentPlayer = "X";
  roundOver = false;
  cells.forEach((cell) => {
    cell.textContent = "";
    cell.disabled = false;
    cell.classList.remove("mark-x", "mark-o", "is-winner");
    const index = Number(cell.dataset.cell);
    cell.setAttribute(
      "aria-label",
      `Row ${Math.floor(index / 3) + 1}, column ${(index % 3) + 1}, empty`,
    );
  });
  updateTurn();
  cells[0].focus();
}

cells.forEach((cell) => cell.addEventListener("click", handleCellClick));
newRoundButton.addEventListener("click", startNewRound);
updateTurn();
