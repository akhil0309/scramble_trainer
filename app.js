const FACE_COLORS = { U: "W", D: "Y", F: "G", B: "B", R: "R", L: "O" };
const AXIS = { U: "y", D: "y", R: "x", L: "x", F: "z", B: "z" };
const MOVE_DESCRIPTIONS = {
  U: "Turn the upper face clockwise.", D: "Turn the down face clockwise.",
  R: "Turn the right face clockwise.", L: "Turn the left face clockwise.",
  F: "Turn the front face clockwise.", B: "Turn the back face clockwise."
};
const PUZZLES = {
  "3x3": {
    size: 3,
    length: 20,
    faces: ["U", "D", "R", "L", "F", "B"],
    label: "3×3",
    session: "SESSION 01 / 3×3",
    disclaimer: "3×3 competition-practice sequence. Official WCA events use random-state scrambles."
  },
  "2x2": {
    size: 2,
    length: 11,
    faces: ["R", "U", "F"],
    label: "2×2",
    session: "SESSION 01 / 2×2",
    disclaimer: "2×2 competition-practice sequence using R/U/F face turns. Official WCA 2×2 scrambles must produce a random state requiring at least 4 moves to solve."
  }
};

const els = Object.fromEntries([
  "scrambleSequence", "scrambleTitle", "scrambleLength", "copyButton",
  "newScrambleButton", "resetButton", "currentStep", "totalSteps", "nextMove",
  "moveDescription", "cubeNet", "previousButton", "nextButton", "stepSlider",
  "showFinalButton", "themeButton", "puzzle2Button", "puzzle3Button",
  "sessionLabel", "scrambleDisclaimer"
].map(id => [id, document.getElementById(id)]));

let currentPuzzle = "3x3";
let scramble = [];
let step = 0;
let cube = [];

function coordAt(index, size) {
  return size === 1 ? 0 : -1 + index * (2 / (size - 1));
}

function solvedCube() {
  const stickers = [];
  const size = PUZZLES[currentPuzzle].size;
  const top = row => coordAt(size - 1 - row, size);
  const pos = col => coordAt(col, size);
  const reverse = col => coordAt(size - 1 - col, size);
  const addFace = (face, mapper) => {
    for (let row = 0; row < size; row++) {
      for (let col = 0; col < size; col++) {
        stickers.push({ ...mapper(row, col), color: FACE_COLORS[face] });
      }
    }
  };
  addFace("F", (row, col) => ({ x: pos(col), y: top(row), z: 1, nx: 0, ny: 0, nz: 1 }));
  addFace("B", (row, col) => ({ x: reverse(col), y: top(row), z: -1, nx: 0, ny: 0, nz: -1 }));
  addFace("U", (row, col) => ({ x: pos(col), y: 1, z: pos(row), nx: 0, ny: 1, nz: 0 }));
  addFace("D", (row, col) => ({ x: pos(col), y: -1, z: top(row), nx: 0, ny: -1, nz: 0 }));
  addFace("R", (row, col) => ({ x: 1, y: top(row), z: reverse(col), nx: 1, ny: 0, nz: 0 }));
  addFace("L", (row, col) => ({ x: -1, y: top(row), z: pos(col), nx: -1, ny: 0, nz: 0 }));
  return stickers;
}

function rotatePair(a, b, turns) {
  let x = a, y = b;
  for (let i = 0; i < ((turns % 4) + 4) % 4; i++) [x, y] = [-y, x];
  return [x, y];
}

function rotateSticker(s, axis, turns) {
  const out = { ...s };
  if (axis === "x") {
    [out.y, out.z] = rotatePair(s.y, s.z, turns);
    [out.ny, out.nz] = rotatePair(s.ny, s.nz, turns);
  } else if (axis === "y") {
    [out.z, out.x] = rotatePair(s.z, s.x, turns);
    [out.nz, out.nx] = rotatePair(s.nz, s.nx, turns);
  } else {
    [out.x, out.y] = rotatePair(s.x, s.y, turns);
    [out.nx, out.ny] = rotatePair(s.nx, s.ny, turns);
  }
  return out;
}

function applyMove(move) {
  const face = move[0];
  const suffix = move.slice(1);
  const config = {
    U: ["y", 1, -1], D: ["y", -1, 1], R: ["x", 1, -1],
    L: ["x", -1, 1], F: ["z", 1, -1], B: ["z", -1, 1]
  }[face];
  const turns = config[2] * (suffix === "2" ? 2 : suffix === "'" ? -1 : 1);
  cube = cube.map(s => s[config[0]] === config[1] ? rotateSticker(s, config[0], turns) : s);
}

function stickerFor(face, row, col) {
  const size = PUZZLES[currentPuzzle].size;
  const top = coordAt(size - 1 - row, size);
  const pos = coordAt(col, size);
  const rowPos = coordAt(row, size);
  const reverse = coordAt(size - 1 - col, size);
  return cube.find(s => {
    if (face === "F") return s.nz === 1 && s.y === top && s.x === pos;
    if (face === "B") return s.nz === -1 && s.y === top && s.x === reverse;
    if (face === "U") return s.ny === 1 && s.z === rowPos && s.x === pos;
    if (face === "D") return s.ny === -1 && s.z === top && s.x === pos;
    if (face === "R") return s.nx === 1 && s.y === top && s.z === reverse;
    return s.nx === -1 && s.y === top && s.z === pos;
  });
}

function placeFace(faceEl, face, size) {
  const positions = {
    U: [1, size + 1], L: [size + 1, 1], F: [size + 1, size + 1],
    R: [size + 1, 2 * size + 1], B: [size + 1, 3 * size + 1],
    D: [2 * size + 1, size + 1]
  };
  const [row, col] = positions[face];
  faceEl.style.gridRow = row;
  faceEl.style.gridColumn = col;
}

function renderCube() {
  const size = PUZZLES[currentPuzzle].size;
  els.cubeNet.innerHTML = "";
  els.cubeNet.style.setProperty("--cube-size", size);
  els.cubeNet.style.setProperty("--net-cols", size * 4);
  els.cubeNet.style.setProperty("--net-rows", size * 3);
  els.cubeNet.setAttribute("aria-label", `Current ${PUZZLES[currentPuzzle].label} cube state`);
  ["U", "L", "F", "R", "B", "D"].forEach(face => {
    const faceEl = document.createElement("div");
    faceEl.className = `face face-${face}`;
    faceEl.setAttribute("aria-label", `${face} face`);
    placeFace(faceEl, face, size);
    for (let row = 0; row < size; row++) {
      for (let col = 0; col < size; col++) {
        const tile = document.createElement("div");
        tile.className = `sticker ${stickerFor(face, row, col).color}`;
        faceEl.appendChild(tile);
      }
    }
    els.cubeNet.appendChild(faceEl);
  });
}

function generateScramble() {
  const config = PUZZLES[currentPuzzle];
  const suffixes = ["", "'", "2"];
  const result = [];
  while (result.length < config.length) {
    const face = config.faces[Math.floor(Math.random() * config.faces.length)];
    const previousFaces = result.map(m => m[0]);
    const last = previousFaces.at(-1);
    const lastTwo = previousFaces.slice(-2);
    if (face === last) continue;
    if (lastTwo.length === 2 && AXIS[face] === AXIS[lastTwo[0]] && AXIS[face] === AXIS[lastTwo[1]]) continue;
    result.push(face + suffixes[Math.floor(Math.random() * suffixes.length)]);
  }
  return result;
}

function descriptionFor(move) {
  if (!move) return "Scramble complete. Verify your cube matches the net.";
  const suffix = move.slice(1);
  const detail = suffix === "'" ? " Counter-clockwise quarter turn." : suffix === "2" ? " Turn it 180 degrees." : "";
  return MOVE_DESCRIPTIONS[move[0]] + detail;
}

function renderScramble() {
  els.scrambleSequence.innerHTML = scramble.map((move, index) =>
    `<span class="move-chip ${index < step ? "done" : index === step ? "current" : ""}">${move.replace("'", "′")}</span>`
  ).join("");
  els.currentStep.textContent = step;
  els.totalSteps.textContent = scramble.length;
  els.scrambleLength.textContent = scramble.length;
  els.nextMove.textContent = scramble[step]?.replace("'", "′") || "✓";
  els.moveDescription.textContent = descriptionFor(scramble[step]);
  els.stepSlider.max = scramble.length;
  els.stepSlider.value = step;
  els.stepSlider.style.setProperty("--progress", `${(step / scramble.length) * 100}%`);
  els.previousButton.disabled = step === 0;
  els.nextButton.disabled = step === scramble.length;
}

function goToStep(target) {
  step = Math.max(0, Math.min(scramble.length, target));
  cube = solvedCube();
  scramble.slice(0, step).forEach(applyMove);
  renderCube();
  renderScramble();
}

function updatePuzzleText() {
  const config = PUZZLES[currentPuzzle];
  els.sessionLabel.textContent = config.session;
  els.scrambleDisclaimer.textContent = config.disclaimer;
  els.puzzle2Button.classList.toggle("is-active", currentPuzzle === "2x2");
  els.puzzle3Button.classList.toggle("is-active", currentPuzzle === "3x3");
}

function newScramble() {
  const config = PUZZLES[currentPuzzle];
  updatePuzzleText();
  scramble = generateScramble();
  els.scrambleTitle.textContent = `${config.label} SCRAMBLE #${String(Math.floor(Math.random() * 999) + 1).padStart(3, "0")}`;
  goToStep(0);
}

function setPuzzle(puzzle) {
  if (currentPuzzle === puzzle) return;
  currentPuzzle = puzzle;
  newScramble();
}

els.newScrambleButton.addEventListener("click", newScramble);
els.resetButton.addEventListener("click", () => goToStep(0));
els.previousButton.addEventListener("click", () => goToStep(step - 1));
els.nextButton.addEventListener("click", () => goToStep(step + 1));
els.showFinalButton.addEventListener("click", () => goToStep(scramble.length));
els.stepSlider.addEventListener("input", e => goToStep(Number(e.target.value)));
els.copyButton.addEventListener("click", async () => {
  await navigator.clipboard.writeText(scramble.join(" "));
  els.copyButton.textContent = "COPIED";
  setTimeout(() => els.copyButton.textContent = "COPY", 1200);
});
els.themeButton.addEventListener("click", () => document.body.classList.toggle("high-contrast"));
els.puzzle2Button.addEventListener("click", () => setPuzzle("2x2"));
els.puzzle3Button.addEventListener("click", () => setPuzzle("3x3"));
document.addEventListener("keydown", event => {
  if (event.code === "ArrowRight") goToStep(step + 1);
  if (event.code === "ArrowLeft") goToStep(step - 1);
});

cube = solvedCube();
newScramble();
