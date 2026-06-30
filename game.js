(() => {
  const canvas = document.getElementById("board");
  const ctx = canvas.getContext("2d");
  const scoreEl = document.getElementById("score");
  const bestEl = document.getElementById("best");
  const overlay = document.getElementById("overlay");
  const overlayTitle = document.getElementById("overlayTitle");
  const overlayText = document.getElementById("overlayText");
  const startBtn = document.getElementById("startBtn");

  const GRID = 20;                 // cells per row/column
  const CELL = canvas.width / GRID; // pixel size of one cell
  const SPEED = 110;               // ms per step (lower = faster)

  // Read CSS colors so the board matches the stylesheet.
  const css = getComputedStyle(document.documentElement);
  const colors = {
    gridA: css.getPropertyValue("--grid-a").trim(),
    gridB: css.getPropertyValue("--grid-b").trim(),
    snake: css.getPropertyValue("--snake").trim(),
    head: css.getPropertyValue("--snake-head").trim(),
    food: css.getPropertyValue("--food").trim(),
  };

  let snake, dir, nextDir, food, score, best = 0;
  let timer = null;
  // state: "idle" (pre-game/game over), "running", "paused"
  let state = "idle";

  function reset() {
    snake = [
      { x: 8, y: 10 },
      { x: 7, y: 10 },
      { x: 6, y: 10 },
    ];
    dir = { x: 1, y: 0 };
    nextDir = dir;
    score = 0;
    scoreEl.textContent = "0";
    placeFood();
    draw();
  }

  function placeFood() {
    do {
      food = {
        x: Math.floor(Math.random() * GRID),
        y: Math.floor(Math.random() * GRID),
      };
    } while (snake.some((s) => s.x === food.x && s.y === food.y));
  }

  function step() {
    dir = nextDir;
    const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };

    // Wall or self collision ends the game.
    const hitWall =
      head.x < 0 || head.y < 0 || head.x >= GRID || head.y >= GRID;
    const hitSelf = snake.some((s) => s.x === head.x && s.y === head.y);
    if (hitWall || hitSelf) {
      endGame();
      return;
    }

    snake.unshift(head);

    if (head.x === food.x && head.y === food.y) {
      score += 1;
      scoreEl.textContent = String(score);
      placeFood();
    } else {
      snake.pop();
    }

    draw();
  }

  function draw() {
    // Checkerboard background.
    for (let y = 0; y < GRID; y++) {
      for (let x = 0; x < GRID; x++) {
        ctx.fillStyle = (x + y) % 2 === 0 ? colors.gridA : colors.gridB;
        ctx.fillRect(x * CELL, y * CELL, CELL, CELL);
      }
    }

    // Food with a soft glow.
    ctx.save();
    ctx.shadowColor = colors.food;
    ctx.shadowBlur = 14;
    ctx.fillStyle = colors.food;
    roundedCell(food.x, food.y, 0.5);
    ctx.restore();

    // Snake.
    snake.forEach((seg, i) => {
      ctx.fillStyle = i === 0 ? colors.head : colors.snake;
      roundedCell(seg.x, seg.y, 0.32);
    });
  }

  function roundedCell(cx, cy, radiusFactor) {
    const pad = 1;
    const x = cx * CELL + pad;
    const y = cy * CELL + pad;
    const size = CELL - pad * 2;
    const r = size * radiusFactor;
    ctx.beginPath();
    ctx.roundRect(x, y, size, size, r);
    ctx.fill();
  }

  function run() {
    state = "running";
    overlay.classList.add("is-hidden");
    clearInterval(timer);
    timer = setInterval(step, SPEED);
  }

  function start() {
    reset();
    run();
  }

  function endGame() {
    state = "idle";
    clearInterval(timer);
    timer = null;
    best = Math.max(best, score);
    bestEl.textContent = String(best);
    overlayTitle.textContent = "Game Over";
    overlayText.textContent = `You scored ${score}. Press Play to try again.`;
    startBtn.textContent = "Play again";
    overlay.classList.remove("is-hidden");
  }

  function pause() {
    state = "paused";
    clearInterval(timer);
    timer = null;
    overlayTitle.textContent = "Paused";
    overlayText.textContent = "Press Space or Resume to continue.";
    startBtn.textContent = "Resume";
    overlay.classList.remove("is-hidden");
  }

  // Single entry point for Space and the on-screen button.
  function primaryAction() {
    if (state === "running") pause();
    else if (state === "paused") run();
    else start();
  }

  function setDirection(x, y) {
    // Prevent reversing directly into the snake's neck.
    if (x === -dir.x && y === -dir.y) return;
    nextDir = { x, y };
  }

  document.addEventListener("keydown", (e) => {
    const k = e.key.toLowerCase();
    if (["arrowup", "arrowdown", "arrowleft", "arrowright", " "].includes(e.key.toLowerCase()) || "wasd".includes(k)) {
      e.preventDefault();
    }
    switch (k) {
      case "arrowup": case "w": setDirection(0, -1); break;
      case "arrowdown": case "s": setDirection(0, 1); break;
      case "arrowleft": case "a": setDirection(-1, 0); break;
      case "arrowright": case "d": setDirection(1, 0); break;
      case " ": primaryAction(); break;
    }
  });

  startBtn.addEventListener("click", primaryAction);

  reset();
})();
