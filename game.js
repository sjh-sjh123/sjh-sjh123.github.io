(function () {
  const GRID_SIZE = 20;
  const TICK_MS = 130;
  const STORAGE_KEY = 'sjh-snake-best-score';
  const DIRECTIONS = {
    up: { x: 0, y: -1, opposite: 'down' },
    down: { x: 0, y: 1, opposite: 'up' },
    left: { x: -1, y: 0, opposite: 'right' },
    right: { x: 1, y: 0, opposite: 'left' },
  };

  function sameCell(a, b) {
    return a.x === b.x && a.y === b.y;
  }

  function randomCell(excluded) {
    let cell = { x: Math.floor(Math.random() * GRID_SIZE), y: Math.floor(Math.random() * GRID_SIZE) };
    while (excluded.some((item) => sameCell(item, cell))) {
      cell = { x: Math.floor(Math.random() * GRID_SIZE), y: Math.floor(Math.random() * GRID_SIZE) };
    }
    return cell;
  }

  class SnakeGame {
    constructor(config) {
      this.canvas = config.canvas;
      this.ctx = this.canvas.getContext('2d');
      this.scoreEl = config.scoreEl;
      this.bestScoreEl = config.bestScoreEl;
      this.statusEl = config.statusEl;
      this.overlayEl = config.overlayEl;
      this.startButton = config.startButton;
      this.pauseButton = config.pauseButton;
      this.restartButton = config.restartButton;
      this.controlButtons = config.controlButtons;
      this.timerId = null;
      this.running = false;
      this.paused = false;
      this.gameOver = false;
      this.score = 0;
      this.bestScore = Number(localStorage.getItem(STORAGE_KEY) || '0');
      this.direction = DIRECTIONS.right;
      this.nextDirection = DIRECTIONS.right;
      this.snake = [];
      this.food = { x: 0, y: 0 };
      this.resizeCanvas();
      this.attachEvents();
      this.reset(true);
      this.render();
    }

    resizeCanvas() {
      const size = 400;
      this.canvas.width = size;
      this.canvas.height = size;
      this.cellSize = size / GRID_SIZE;
    }

    attachEvents() {
      window.addEventListener('resize', () => {
        this.resizeCanvas();
        this.render();
      });

      document.addEventListener('keydown', (event) => {
        const key = event.key.toLowerCase();
        if (key === ' ' || key === 'spacebar') {
          event.preventDefault();
          this.togglePause();
          return;
        }

        const keyMap = {
          arrowup: 'up',
          w: 'up',
          arrowdown: 'down',
          s: 'down',
          arrowleft: 'left',
          a: 'left',
          arrowright: 'right',
          d: 'right',
        };

        const mapped = keyMap[key];
        if (mapped) {
          event.preventDefault();
          this.setDirection(mapped);
          if (!this.running && !this.gameOver) {
            this.start();
          }
        }
      });

      this.startButton.addEventListener('click', () => this.start());
      this.pauseButton.addEventListener('click', () => this.togglePause());
      this.restartButton.addEventListener('click', () => this.restart());
      this.controlButtons.forEach((button) => {
        button.addEventListener('click', () => {
          const direction = button.dataset.direction;
          if (direction) {
            this.setDirection(direction);
            if (!this.running && !this.gameOver) {
              this.start();
            }
          }
        });
      });
    }

    reset(preserveBest = false) {
      if (!preserveBest && this.score > this.bestScore) {
        this.bestScore = this.score;
        localStorage.setItem(STORAGE_KEY, String(this.bestScore));
      }
      this.score = 0;
      this.direction = DIRECTIONS.right;
      this.nextDirection = DIRECTIONS.right;
      this.snake = [
        { x: 5, y: 10 },
        { x: 4, y: 10 },
        { x: 3, y: 10 },
      ];
      this.food = randomCell(this.snake);
      this.running = false;
      this.paused = false;
      this.gameOver = false;
      this.updateUI('Ready');
      this.hideOverlay(false);
      this.render();
    }

    start() {
      if (this.gameOver) {
        this.reset(true);
      }
      if (this.running && !this.paused) {
        return;
      }
      this.running = true;
      this.paused = false;
      this.updateUI('Playing');
      this.hideOverlay(true);
      this.beginLoop();
    }

    beginLoop() {
      this.clearLoop();
      this.timerId = window.setInterval(() => this.step(), TICK_MS);
    }

    clearLoop() {
      if (this.timerId !== null) {
        window.clearInterval(this.timerId);
        this.timerId = null;
      }
    }

    togglePause() {
      if (!this.running && !this.gameOver) {
        this.start();
        return;
      }
      if (this.gameOver) {
        this.restart();
        return;
      }

      this.paused = !this.paused;
      if (this.paused) {
        this.clearLoop();
        this.updateUI('Paused');
        this.hideOverlay(false, 'Paused');
      } else {
        this.updateUI('Playing');
        this.hideOverlay(true);
        this.beginLoop();
      }
    }

    restart() {
      this.clearLoop();
      this.reset(true);
      this.start();
    }

    setDirection(directionName) {
      const requested = DIRECTIONS[directionName];
      if (!requested) {
        return;
      }

      const activeDirectionName = this.nextDirectionName();
      if (requested.opposite === activeDirectionName) {
        return;
      }

      this.nextDirection = requested;
    }

    directionName() {
      return Object.keys(DIRECTIONS).find((key) => DIRECTIONS[key] === this.direction) || 'right';
    }

    nextDirectionName() {
      return Object.keys(DIRECTIONS).find((key) => DIRECTIONS[key] === this.nextDirection) || 'right';
    }

    step() {
      if (!this.running || this.paused || this.gameOver) {
        return;
      }

      this.direction = this.nextDirection;
      const head = this.snake[0];
      const nextHead = {
        x: head.x + this.direction.x,
        y: head.y + this.direction.y,
      };

      const hitWall = nextHead.x < 0 || nextHead.x >= GRID_SIZE || nextHead.y < 0 || nextHead.y >= GRID_SIZE;
      const hitSelf = this.snake.some((segment) => sameCell(segment, nextHead));

      if (hitWall || hitSelf) {
        this.finishGame();
        return;
      }

      this.snake.unshift(nextHead);

      if (sameCell(nextHead, this.food)) {
        this.score += 10;
        this.food = randomCell(this.snake);
      } else {
        this.snake.pop();
      }

      if (this.score > this.bestScore) {
        this.bestScore = this.score;
        localStorage.setItem(STORAGE_KEY, String(this.bestScore));
      }

      this.updateUI('Playing');
      this.render();
    }

    finishGame() {
      this.gameOver = true;
      this.running = false;
      this.paused = false;
      this.clearLoop();
      this.updateUI('Game Over');
      this.hideOverlay(false, 'Game Over');
      this.render();
    }

    updateUI(status) {
      this.scoreEl.textContent = String(this.score);
      this.bestScoreEl.textContent = String(this.bestScore);
      this.statusEl.textContent = status;
      this.pauseButton.textContent = this.paused ? 'Resume' : 'Pause';
      this.startButton.textContent = this.gameOver ? 'Start Again' : 'Start';
    }

    hideOverlay(hidden, title = 'Press Start') {
      if (hidden) {
        this.overlayEl.classList.add('is-hidden');
      } else {
        this.overlayEl.classList.remove('is-hidden');
        this.overlayEl.querySelector('strong').textContent = title;
        this.overlayEl.querySelector('span').textContent = this.gameOver
          ? 'Restart로 다시 시작하세요'
          : this.paused
            ? '일시정지 상태입니다'
            : '화살표, WASD, 모바일 버튼으로 조작';
      }
    }

    render() {
      const ctx = this.ctx;
      const size = this.canvas.width;
      const cellSize = size / GRID_SIZE;

      ctx.clearRect(0, 0, size, size);

      for (let y = 0; y < GRID_SIZE; y += 1) {
        for (let x = 0; x < GRID_SIZE; x += 1) {
          ctx.fillStyle = (x + y) % 2 === 0 ? '#071021' : '#081426';
          ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
        }
      }

      ctx.fillStyle = '#f97316';
      this.drawRoundedRect(ctx, this.food.x * cellSize + 3, this.food.y * cellSize + 3, cellSize - 6, cellSize - 6, 8);

      this.snake.forEach((segment, index) => {
        const isHead = index === 0;
        ctx.fillStyle = isHead ? '#7dd3fc' : index < 3 ? '#38bdf8' : '#22c55e';
        this.drawRoundedRect(ctx, segment.x * cellSize + 2, segment.y * cellSize + 2, cellSize - 4, cellSize - 4, 8);
      });
    }

    drawRoundedRect(ctx, x, y, width, height, radius) {
      const r = Math.min(radius, width / 2, height / 2);
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + width, y, x + width, y + height, r);
      ctx.arcTo(x + width, y + height, x, y + height, r);
      ctx.arcTo(x, y + height, x, y, r);
      ctx.arcTo(x, y, x + width, y, r);
      ctx.closePath();
      ctx.fill();
    }
  }

  window.SnakeGame = SnakeGame;
})();
