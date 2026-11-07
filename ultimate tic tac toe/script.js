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

const boardElement = document.querySelector("#ultimate-board");
const statusElement = document.querySelector("#game-status");
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

const miniBoards = [];
const cells = [];

for (let boardIndex = 0; boardIndex < 9; boardIndex += 1) {
  const miniBoard = document.createElement("div");
  miniBoard.className = "mini-board";
  miniBoard.setAttribute("role", "group");
  miniBoard.setAttribute("aria-label", `Small board ${boardIndex + 1}, open`);
  miniBoard.dataset.board = boardIndex;

  const boardCells = [];
  for (let cellIndex = 0; cellIndex < 9; cellIndex += 1) {
    const cell = document.createElement("button");
    const row = Math.floor(cellIndex / 3) + 1;
    const column = (cellIndex % 3) + 1;

    cell.className = "mini-cell";
    cell.type = "button";
    cell.dataset.board = boardIndex;
    cell.dataset.cell = cellIndex;
    cell.setAttribute(
      "aria-label",
      `Board ${boardIndex + 1}, row ${row}, column ${column}, empty`,
    );
    cell.addEventListener("click", handleCellClick);
    miniBoard.append(cell);
    boardCells.push(cell);
    cells.push(cell);
  }

  const result = document.createElement("span");
  result.className = "board-result";
  result.setAttribute("aria-hidden", "true");
  miniBoard.append(result);
  boardElement.append(miniBoard);
  miniBoards.push({ element: miniBoard, cells: boardCells, result });
}

let boards = Array.from({ length: 9 }, () => Array(9).fill(""));
let owners = Array(9).fill("");
let currentPlayer = "X";
let activeBoard = null;
let roundOver = false;
const scores = { X: 0, O: 0, draw: 0 };

function getWinningLine(board) {
  return winningLines.find((line) => line.every((index) => board[index] === currentPlayer));
}

function updateTurn() {
  scoreCards.X.classList.toggle("is-current", currentPlayer === "X" && !roundOver);
  scoreCards.O.classList.toggle("is-current", currentPlayer === "O" && !roundOver);

  if (activeBoard === null) {
    statusElement.textContent = `Player ${currentPlayer}'s turn — play in any open board`;
  } else {
    statusElement.textContent =
      `Player ${currentPlayer}'s turn — play in board ${activeBoard + 1}`;
  }
}

function updateBoardAvailability() {
  miniBoards.forEach(({ element, cells: boardCells }, boardIndex) => {
    const isClosed = Boolean(owners[boardIndex]);
    const isRequired = !roundOver && activeBoard === boardIndex;
    const isAvailable = !roundOver && !isClosed && (activeBoard === null || isRequired);

    element.classList.toggle("is-required", isRequired);
    element.classList.toggle("is-closed", isClosed);
    element.setAttribute(
      "aria-label",
      `Small board ${boardIndex + 1}, ${
        owners[boardIndex] === "draw" ? "drawn" : isClosed ? `won by ${owners[boardIndex]}` : "open"
      }`,
    );

    boardCells.forEach((cell, cellIndex) => {
      cell.disabled = !isAvailable || Boolean(boards[boardIndex][cellIndex]);
    });
  });
}

function finishRound(message, winner) {
  roundOver = true;
  statusElement.textContent = message;
  scoreCards.X.classList.remove("is-current");
  scoreCards.O.classList.remove("is-current");

  if (winner) {
    scores[winner] += 1;
  } else {
    scores.draw += 1;
  }

  scoreElements.X.textContent = scores.X;
  scoreElements.O.textContent = scores.O;
  scoreElements.draw.textContent = scores.draw;
  updateBoardAvailability();
  newRoundButton.focus();
}

function handleCellClick(event) {
  const cell = event.currentTarget;
  const boardIndex = Number(cell.dataset.board);
  const cellIndex = Number(cell.dataset.cell);
  if (
    roundOver ||
    owners[boardIndex] ||
    boards[boardIndex][cellIndex] ||
    (activeBoard !== null && activeBoard !== boardIndex)
  ) {
    return;
  }

  boards[boardIndex][cellIndex] = currentPlayer;
  cell.textContent = currentPlayer;
  cell.classList.add(currentPlayer === "X" ? "mark-x" : "mark-o");
  cell.setAttribute(
    "aria-label",
    `Board ${boardIndex + 1}, row ${Math.floor(cellIndex / 3) + 1}, column ${(cellIndex % 3) + 1}, ${currentPlayer}`,
  );

  const localWinningLine = getWinningLine(boards[boardIndex]);
  if (localWinningLine) {
    owners[boardIndex] = currentPlayer;
    miniBoards[boardIndex].result.textContent = currentPlayer;
    miniBoards[boardIndex].element.classList.add("is-won");
    localWinningLine.forEach((index) => {
      miniBoards[boardIndex].cells[index].classList.add("is-winner");
    });
  } else if (boards[boardIndex].every(Boolean)) {
    owners[boardIndex] = "draw";
    miniBoards[boardIndex].result.textContent = "＝";
    miniBoards[boardIndex].element.classList.add("is-drawn");
  }

  const overallWinningLine = getWinningLine(owners);
  if (overallWinningLine) {
    overallWinningLine.forEach((index) => {
      miniBoards[index].element.classList.add("is-overall-winner");
    });
    finishRound(`Player ${currentPlayer} wins the game!`, currentPlayer);
    return;
  }

  if (owners.every(Boolean)) {
    finishRound("It's a draw! Nice game.", null);
    return;
  }

  currentPlayer = currentPlayer === "X" ? "O" : "X";
  activeBoard = owners[cellIndex] ? null : cellIndex;
  updateBoardAvailability();
  updateTurn();
}

function startNewRound() {
  boards = Array.from({ length: 9 }, () => Array(9).fill(""));
  owners = Array(9).fill("");
  currentPlayer = "X";
  activeBoard = null;
  roundOver = false;

  miniBoards.forEach(({ element, cells: boardCells, result }) => {
    element.classList.remove("is-won", "is-drawn", "is-overall-winner");
    result.textContent = "";
    boardCells.forEach((cell, cellIndex) => {
      cell.textContent = "";
      cell.classList.remove("mark-x", "mark-o", "is-winner");
      cell.setAttribute(
        "aria-label",
        `Board ${Number(element.dataset.board) + 1}, row ${Math.floor(cellIndex / 3) + 1}, column ${(cellIndex % 3) + 1}, empty`,
      );
    });
  });

  updateBoardAvailability();
  updateTurn();
  cells[0].focus();
}

newRoundButton.addEventListener("click", startNewRound);
updateBoardAvailability();
updateTurn();
