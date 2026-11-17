export class SnakeGame {
  static GRID_SIZE = 20;
  static INITIAL_TICK_MS = 140;
  static MIN_TICK_MS = 75;
  static SPEED_STEP_MS = 2;
  static POINTS_PER_APPLE = 10;
  static BEST_SCORE_KEY = 'snake_best_score';
  static SWIPE_THRESHOLD_PX = 30;
  static MAX_QUEUE_LENGTH = 2;

  static STATES = Object.freeze({
    TITLE: 'title',
    PLAYING: 'playing',
    PAUSED: 'paused',
    GAME_OVER: 'gameover',
  });

  static DIRECTIONS = Object.freeze({
    UP: Object.freeze({ x: 0, y: -1, angle: -Math.PI / 2 }),
    DOWN: Object.freeze({ x: 0, y: 1, angle: Math.PI / 2 }),
    LEFT: Object.freeze({ x: -1, y: 0, angle: Math.PI }),
    RIGHT: Object.freeze({ x: 1, y: 0, angle: 0 }),
  });

  static APPLE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
    <path d="M32 16c-5-4.8-13.2-4.2-17.6 1.2-4.8 5.8-4.8 17-.4 26 3.3 6.8 8.3 12 13.4 12 2.2 0 3.6-.8 4.6-.8s2.4.8 4.6.8c5.1 0 10.1-5.2 13.4-12 4.4-9 4.4-20.2-.4-26C45.2 11.8 37 11.2 32 16z" fill="#ef4444" stroke="#7f1d1d" stroke-width="3" stroke-linejoin="round"/>
    <path d="M32 15.5c0-5.4 2.8-9.2 6.6-10.6" fill="none" stroke="#a16207" stroke-width="3.8" stroke-linecap="round"/>
    <path d="M33 13.5c4.6-4.8 11.4-5.4 14.2-1.2-3 4-9 5.2-14.2 1.2z" fill="#4ade80" stroke="#14532d" stroke-width="2" stroke-linejoin="round"/>
    <ellipse cx="22.5" cy="27.5" rx="3.5" ry="6.8" transform="rotate(-18 22.5 27.5)" fill="#fecaca" opacity="0.72"/>
  </svg>`;

  static SNAKE_HEAD_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
    <path d="M51 32h10l3-3.5M61 32l3 3.5" fill="none" stroke="#f43f5e" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
    <rect x="6" y="8" width="48" height="48" rx="18" fill="#22c55e" stroke="#052e16" stroke-width="3"/>
    <rect x="12" y="13" width="32" height="10" rx="5" fill="#86efac" opacity="0.32"/>
    <circle cx="38" cy="20" r="6.5" fill="#ffffff" stroke="#052e16" stroke-width="2"/>
    <circle cx="38" cy="44" r="6.5" fill="#ffffff" stroke="#052e16" stroke-width="2"/>
    <circle cx="40" cy="20" r="3" fill="#052e16"/>
    <circle cx="40" cy="44" r="3" fill="#052e16"/>
    <circle cx="39" cy="18.8" r="1" fill="#ffffff"/>
    <circle cx="39" cy="42.8" r="1" fill="#ffffff"/>
    <circle cx="48" cy="27" r="1.4" fill="#052e16"/>
    <circle cx="48" cy="37" r="1.4" fill="#052e16"/>
  </svg>`;

  constructor(options = {}) {
    this.headless = Boolean(options.headless);
    this.storage = options.storage !== undefined ? options.storage : this.#getSafeStorage();
    this.rng = typeof options.rng === 'function' ? options.rng : Math.random;

    this.state = SnakeGame.STATES.TITLE;
    this.score = 0;
    this.bestScore = this.#loadBestScore();
    this.runStartBestScore = this.bestScore;
    this.isNewBest = false;
    this.isWin = false;
    this.muted = false;
    this.spritesLoaded = false;

    this.snake = [];
    this.direction = SnakeGame.DIRECTIONS.RIGHT;
    this.inputQueue = [];
    this.apple = { x: 14, y: 10 };
    this.applesEaten = 0;
    this.tickIntervalMs = SnakeGame.INITIAL_TICK_MS;
    this.accumulatorMs = 0;
    this.lastFrameTime = 0;
    this.rafId = null;

    this.audioCtx = null;
    this.sprites = { apple: null, head: null };
    this.touchStart = null;
    this.canvasSize = 400;
    this.dpr = 1;

    this.dom = {};
    this.#boundHandlers = {
      resize: () => this.#resizeCanvas(),
      keydown: (e) => this.#handleKeyDown(e),
      touchstart: (e) => this.#handleTouchStart(e),
      touchend: (e) => this.#handleTouchEnd(e),
      visibilitychange: () => {
        if (typeof document !== 'undefined' && document.hidden && this.state === SnakeGame.STATES.PLAYING) {
          this.pauseGame();
        }
      },
      frame: (now) => this.#loop(now),
    };

    this.resetBoardState();
  }

  #boundHandlers;

  async init() {
    if (this.headless || typeof document === 'undefined') {
      return;
    }

    this.#cacheDom();
    this.#bindEvents();
    this.#resizeCanvas();
    this.#syncHud();
    this.#syncOverlay();
    this.#render(performance.now());

    try {
      await this.#preloadSprites();
      this.spritesLoaded = true;
    } catch {
      this.spritesLoaded = true;
    }

    if (this.dom.primaryCta) {
      this.dom.primaryCta.disabled = false;
    }
    this.#syncOverlay();
    this.#render(performance.now());

    const params = new URLSearchParams(window.location.search);
    if (params.get('autostart') === '1') {
      this.startGame(false);
    }
  }

  destroy() {
    if (this.rafId !== null && typeof cancelAnimationFrame === 'function') {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    if (typeof window !== 'undefined') {
      window.removeEventListener('resize', this.#boundHandlers.resize);
      window.removeEventListener('keydown', this.#boundHandlers.keydown);
    }
    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', this.#boundHandlers.visibilitychange);
    }
  }

  resetBoardState() {
    const midY = Math.floor(SnakeGame.GRID_SIZE / 2);
    this.snake = [
      { x: 6, y: midY },
      { x: 5, y: midY },
      { x: 4, y: midY },
    ];
    this.direction = SnakeGame.DIRECTIONS.RIGHT;
    this.inputQueue = [];
    this.score = 0;
    this.applesEaten = 0;
    this.tickIntervalMs = SnakeGame.INITIAL_TICK_MS;
    this.accumulatorMs = 0;
    this.isNewBest = false;
    this.isWin = false;
    this.apple = this.spawnApple();
  }

  startGame(fromUserGesture = true) {
    if (!this.headless && !this.spritesLoaded) {
      return;
    }
    if (fromUserGesture) {
      this.#unlockAudio();
    }
    this.runStartBestScore = this.bestScore;
    this.resetBoardState();
    this.state = SnakeGame.STATES.PLAYING;
    this.#blurActiveElement();
    this.#syncBodyState();
    this.#syncHud();
    this.#syncOverlay();
    this.#startLoop();
  }

  pauseGame() {
    if (this.state !== SnakeGame.STATES.PLAYING) {
      return;
    }
    this.state = SnakeGame.STATES.PAUSED;
    this.#stopLoop();
    this.#syncBodyState();
    this.#syncHud();
    this.#syncOverlay();
    this.#render(performance.now());
  }

  resumeGame() {
    if (this.state !== SnakeGame.STATES.PAUSED) {
      return;
    }
    this.#unlockAudio();
    this.state = SnakeGame.STATES.PLAYING;
    this.#blurActiveElement();
    this.#syncBodyState();
    this.#syncHud();
    this.#syncOverlay();
    this.#startLoop();
  }

  togglePause() {
    if (this.state === SnakeGame.STATES.PLAYING) {
      this.pauseGame();
    } else if (this.state === SnakeGame.STATES.PAUSED) {
      this.resumeGame();
    }
  }

  toggleMute() {
    this.#unlockAudio();
    this.muted = !this.muted;
    this.#syncHud();
  }

  enqueueDirection(nextDir) {
    if (!nextDir || this.state !== SnakeGame.STATES.PLAYING) {
      return false;
    }
    if (this.inputQueue.length >= SnakeGame.MAX_QUEUE_LENGTH) {
      return false;
    }

    const referenceDir =
      this.inputQueue.length > 0
        ? this.inputQueue[this.inputQueue.length - 1]
        : this.direction;

    if (nextDir.x === referenceDir.x && nextDir.y === referenceDir.y) {
      return false;
    }
    if (nextDir.x + referenceDir.x === 0 && nextDir.y + referenceDir.y === 0) {
      return false;
    }

    this.inputQueue.push(nextDir);
    return true;
  }

  computeTickInterval(applesEaten) {
    return Math.max(
      SnakeGame.MIN_TICK_MS,
      SnakeGame.INITIAL_TICK_MS - applesEaten * SnakeGame.SPEED_STEP_MS
    );
  }

  spawnApple() {
    const occupied = new Set(this.snake.map((seg) => `${seg.x},${seg.y}`));
    const freeCells = [];
    for (let y = 0; y < SnakeGame.GRID_SIZE; y += 1) {
      for (let x = 0; x < SnakeGame.GRID_SIZE; x += 1) {
        if (!occupied.has(`${x},${y}`)) {
          freeCells.push({ x, y });
        }
      }
    }

    if (freeCells.length === 0) {
      return null;
    }

    const index = Math.floor(this.rng() * freeCells.length);
    return freeCells[Math.min(index, freeCells.length - 1)];
  }

  step() {
    if (this.state !== SnakeGame.STATES.PLAYING) {
      return false;
    }

    if (this.inputQueue.length > 0) {
      this.direction = this.inputQueue.shift();
    }

    const head = this.snake[0];
    const nextHead = {
      x: head.x + this.direction.x,
      y: head.y + this.direction.y,
    };

    if (
      nextHead.x < 0 ||
      nextHead.x >= SnakeGame.GRID_SIZE ||
      nextHead.y < 0 ||
      nextHead.y >= SnakeGame.GRID_SIZE
    ) {
      this.#finishGame(false);
      return false;
    }

    const willEat =
      this.apple !== null &&
      nextHead.x === this.apple.x &&
      nextHead.y === this.apple.y;

    const collisionLimit = willEat ? this.snake.length : this.snake.length - 1;
    for (let i = 0; i < collisionLimit; i += 1) {
      if (this.snake[i].x === nextHead.x && this.snake[i].y === nextHead.y) {
        this.#finishGame(false);
        return false;
      }
    }

    this.snake.unshift(nextHead);

    if (willEat) {
      this.score += SnakeGame.POINTS_PER_APPLE;
      this.applesEaten += 1;
      this.tickIntervalMs = this.computeTickInterval(this.applesEaten);

      if (this.score > this.bestScore) {
        this.bestScore = this.score;
        this.#saveBestScore(this.bestScore);
      }
      if (this.score > this.runStartBestScore) {
        this.isNewBest = true;
      }

      if (this.snake.length >= SnakeGame.GRID_SIZE * SnakeGame.GRID_SIZE) {
        this.apple = null;
        this.#playTone('win');
        this.#finishGame(true);
        return true;
      }

      this.apple = this.spawnApple();
      this.#playTone('eat');
      this.#syncHud();
    } else {
      this.snake.pop();
    }

    return true;
  }

  #finishGame(isWin) {
    this.isWin = isWin;
    this.state = SnakeGame.STATES.GAME_OVER;
    this.#stopLoop();
    if (!isWin) {
      this.#playTone('crash');
    }
    this.#syncBodyState();
    this.#syncHud();
    this.#syncOverlay();
  }

  #startLoop() {
    if (this.headless || typeof requestAnimationFrame !== 'function') {
      return;
    }
    this.#stopLoop();
    this.lastFrameTime = performance.now();
    this.accumulatorMs = 0;
    this.rafId = requestAnimationFrame(this.#boundHandlers.frame);
  }

  #stopLoop() {
    if (this.rafId !== null && typeof cancelAnimationFrame === 'function') {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  #loop(now) {
    if (this.state !== SnakeGame.STATES.PLAYING) {
      this.rafId = null;
      return;
    }

    const rawDelta = now - this.lastFrameTime;
    this.lastFrameTime = now;
    const clampedDelta = Math.min(Math.max(rawDelta, 0), 100);
    this.accumulatorMs += clampedDelta;

    while (this.accumulatorMs >= this.tickIntervalMs) {
      this.accumulatorMs -= this.tickIntervalMs;
      const alive = this.step();
      if (!alive) {
        this.#render(now);
        return;
      }
    }

    this.#render(now);
    this.rafId = requestAnimationFrame(this.#boundHandlers.frame);
  }

  #cacheDom() {
    this.dom = {
      scoreValue: document.getElementById('score-value'),
      bestValue: document.getElementById('best-value'),
      muteBtn: document.getElementById('mute-btn'),
      iconSoundOn: document.getElementById('icon-sound-on'),
      iconSoundOff: document.getElementById('icon-sound-off'),
      pauseBtn: document.getElementById('pause-btn'),
      iconPause: document.getElementById('icon-pause'),
      iconPlay: document.getElementById('icon-play'),
      boardStage: document.getElementById('board-stage'),
      canvas: document.getElementById('game-canvas'),
      overlay: document.getElementById('game-overlay'),
      overlayEmblem: document.getElementById('overlay-emblem'),
      newBestBadge: document.getElementById('new-best-badge'),
      overlayTitle: document.getElementById('overlay-title'),
      overlaySubtitle: document.getElementById('overlay-subtitle'),
      overlayStats: document.getElementById('overlay-stats'),
      finalScoreValue: document.getElementById('final-score-value'),
      finalBestValue: document.getElementById('final-best-value'),
      primaryCta: document.getElementById('primary-cta'),
      secondaryCta: document.getElementById('secondary-cta'),
      controlHints: document.getElementById('control-hints'),
      dpadButtons: Array.from(document.querySelectorAll('.dpad-btn')),
    };
    if (this.dom.canvas) {
      this.ctx = this.dom.canvas.getContext('2d');
    }
  }

  #bindEvents() {
    window.addEventListener('resize', this.#boundHandlers.resize);
    window.addEventListener('keydown', this.#boundHandlers.keydown);
    document.addEventListener('visibilitychange', this.#boundHandlers.visibilitychange);

    if (this.dom.muteBtn) {
      this.dom.muteBtn.addEventListener('click', () => {
        this.toggleMute();
        this.dom.muteBtn.blur();
      });
    }

    if (this.dom.pauseBtn) {
      this.dom.pauseBtn.addEventListener('click', () => {
        this.togglePause();
        this.dom.pauseBtn.blur();
      });
    }

    if (this.dom.primaryCta) {
      this.dom.primaryCta.addEventListener('click', () => {
        if (this.state === SnakeGame.STATES.PAUSED) {
          this.resumeGame();
        } else {
          this.startGame();
        }
      });
    }

    if (this.dom.secondaryCta) {
      this.dom.secondaryCta.addEventListener('click', () => {
        this.startGame();
      });
    }

    if (this.dom.canvas) {
      this.dom.canvas.addEventListener('touchstart', this.#boundHandlers.touchstart, { passive: false });
      this.dom.canvas.addEventListener('touchend', this.#boundHandlers.touchend, { passive: false });
    }

    for (const btn of this.dom.dpadButtons) {
      const dirKey = btn.dataset.dir;
      const dir = SnakeGame.DIRECTIONS[dirKey];
      if (!dir) continue;

      btn.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        this.#unlockAudio();
        btn.classList.add('is-pressed');
        if (this.state === SnakeGame.STATES.PLAYING) {
          this.enqueueDirection(dir);
        }
      });

      const clearPress = () => btn.classList.remove('is-pressed');
      btn.addEventListener('pointerup', clearPress);
      btn.addEventListener('pointercancel', clearPress);
      btn.addEventListener('pointerleave', clearPress);
    }
  }

  #handleKeyDown(e) {
    const key = e.key;
    const lower = key.toLowerCase();

    if (key === 'ArrowUp' || key === 'ArrowDown' || key === 'ArrowLeft' || key === 'ArrowRight' || key === ' ') {
      e.preventDefault();
    }

    if (lower === 'm') {
      this.#unlockAudio();
      this.toggleMute();
      return;
    }

    if (this.state === SnakeGame.STATES.TITLE || this.state === SnakeGame.STATES.GAME_OVER) {
      if (key === 'Enter' || key === ' ') {
        this.startGame(true);
      }
      return;
    }

    if (this.state === SnakeGame.STATES.PAUSED) {
      if (lower === 'p' || key === ' ' || key === 'Escape' || key === 'Enter') {
        this.resumeGame();
      }
      return;
    }

    if (this.state === SnakeGame.STATES.PLAYING) {
      this.#unlockAudio();
      if (lower === 'p' || key === ' ' || key === 'Escape') {
        this.pauseGame();
        return;
      }
      if (key === 'ArrowUp' || lower === 'w') {
        this.enqueueDirection(SnakeGame.DIRECTIONS.UP);
      } else if (key === 'ArrowDown' || lower === 's') {
        this.enqueueDirection(SnakeGame.DIRECTIONS.DOWN);
      } else if (key === 'ArrowLeft' || lower === 'a') {
        this.enqueueDirection(SnakeGame.DIRECTIONS.LEFT);
      } else if (key === 'ArrowRight' || lower === 'd') {
        this.enqueueDirection(SnakeGame.DIRECTIONS.RIGHT);
      }
    }
  }

  #handleTouchStart(e) {
    if (e.touches.length === 0) return;
    e.preventDefault();
    const touch = e.touches[0];
    this.touchStart = { x: touch.clientX, y: touch.clientY };
  }

  #handleTouchEnd(e) {
    if (!this.touchStart || e.changedTouches.length === 0) return;
    e.preventDefault();
    const touch = e.changedTouches[0];
    const dx = touch.clientX - this.touchStart.x;
    const dy = touch.clientY - this.touchStart.y;
    this.touchStart = null;

    const absX = Math.abs(dx);
    const absY = Math.abs(dy);
    if (Math.max(absX, absY) < SnakeGame.SWIPE_THRESHOLD_PX) {
      return;
    }

    if (this.state === SnakeGame.STATES.PLAYING) {
      if (absX > absY) {
        this.enqueueDirection(dx > 0 ? SnakeGame.DIRECTIONS.RIGHT : SnakeGame.DIRECTIONS.LEFT);
      } else {
        this.enqueueDirection(dy > 0 ? SnakeGame.DIRECTIONS.DOWN : SnakeGame.DIRECTIONS.UP);
      }
    }
  }

  #resizeCanvas() {
    if (!this.dom.canvas || !this.dom.boardStage) return;

    const hudEl = document.querySelector('.hud-bar');
    const dpadEl = document.querySelector('.dpad');
    const hudHeight = hudEl ? hudEl.getBoundingClientRect().height : 64;
    const dpadVisible = dpadEl && window.getComputedStyle(dpadEl).display !== 'none';
    const dpadHeight = dpadVisible ? dpadEl.getBoundingClientRect().height : 0;

    const verticalOverhead = hudHeight + dpadHeight + (dpadVisible ? 56 : 52);
    const availW = window.innerWidth - 44;
    const availH = window.innerHeight - verticalOverhead;
    const maxDimension = Math.min(availW, availH, 588);
    const clamped = Math.max(240, maxDimension);
    const snapped = Math.floor(clamped / SnakeGame.GRID_SIZE) * SnakeGame.GRID_SIZE;
    const size = Math.max(240, snapped);

    this.canvasSize = size;
    this.dpr = Math.min(window.devicePixelRatio || 1, 3);

    this.dom.canvas.style.width = `${size}px`;
    this.dom.canvas.style.height = `${size}px`;
    this.dom.canvas.width = Math.round(size * this.dpr);
    this.dom.canvas.height = Math.round(size * this.dpr);

    if (hudEl) {
      hudEl.style.maxWidth = `${size + 14}px`;
    }

    this.#render(performance.now());
  }

  #preloadSprites() {
    const loadImage = (svgText) =>
      new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = (err) => reject(err);
        img.src = `data:image/svg+xml;utf8,${encodeURIComponent(svgText)}`;
      });

    return Promise.all([
      loadImage(SnakeGame.APPLE_SVG),
      loadImage(SnakeGame.SNAKE_HEAD_SVG),
    ]).then(([appleImg, headImg]) => {
      this.sprites.apple = appleImg;
      this.sprites.head = headImg;
    });
  }

  #render(now = 0) {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const size = this.canvasSize;
    const cell = size / SnakeGame.GRID_SIZE;

    ctx.save();
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);

    // 1. Two-tone checkerboard grid
    for (let y = 0; y < SnakeGame.GRID_SIZE; y += 1) {
      for (let x = 0; x < SnakeGame.GRID_SIZE; x += 1) {
        ctx.fillStyle = (x + y) % 2 === 0 ? '#1b3126' : '#223b2f';
        ctx.fillRect(x * cell, y * cell, cell, cell);
      }
    }

    // 2. Apple sprite
    if (this.apple) {
      const cx = (this.apple.x + 0.5) * cell;
      const cy = (this.apple.y + 0.5) * cell;
      const pulse =
        this.state === SnakeGame.STATES.PLAYING
          ? 0.94 + 0.06 * Math.sin(now * 0.006)
          : 0.96;
      const drawSize = cell * pulse;

      if (this.sprites.apple) {
        ctx.drawImage(
          this.sprites.apple,
          cx - drawSize / 2,
          cy - drawSize / 2,
          drawSize,
          drawSize
        );
      } else {
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(cx, cy, drawSize * 0.4, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 3. Snake body & tail (tail to neck)
    const len = this.snake.length;
    for (let i = len - 1; i >= 1; i -= 1) {
      const seg = this.snake[i];
      const isTail = i === len - 1;
      const inset = isTail ? cell * 0.16 : cell * 0.09;
      const segSize = cell - inset * 2;
      const radius = isTail ? segSize * 0.46 : segSize * 0.34;

      ctx.fillStyle = i % 2 === 0 ? '#22c55e' : '#16a34a';
      this.#drawRoundedRect(
        ctx,
        seg.x * cell + inset,
        seg.y * cell + inset,
        segSize,
        segSize,
        radius
      );
      ctx.fill();

      ctx.strokeStyle = 'rgba(5, 46, 22, 0.38)';
      ctx.lineWidth = 1;
      ctx.stroke();

      if (!isTail) {
        ctx.fillStyle = 'rgba(187, 247, 208, 0.14)';
        this.#drawRoundedRect(
          ctx,
          seg.x * cell + inset + 2,
          seg.y * cell + inset + 2,
          segSize - 4,
          Math.max(2, (segSize - 4) * 0.32),
          Math.max(1, radius * 0.5)
        );
        ctx.fill();
      }
    }

    // 4. Snake head sprite rotated to active direction
    if (len > 0) {
      const head = this.snake[0];
      const hx = (head.x + 0.5) * cell;
      const hy = (head.y + 0.5) * cell;
      const headSize = cell * 1.06;

      ctx.save();
      ctx.translate(hx, hy);
      ctx.rotate(this.direction.angle);
      if (this.sprites.head) {
        ctx.drawImage(
          this.sprites.head,
          -headSize / 2,
          -headSize / 2,
          headSize,
          headSize
        );
      } else {
        ctx.fillStyle = '#22c55e';
        this.#drawRoundedRect(ctx, -cell * 0.45, -cell * 0.45, cell * 0.9, cell * 0.9, cell * 0.3);
        ctx.fill();
      }
      ctx.restore();
    }

    ctx.restore();
  }

  #drawRoundedRect(ctx, x, y, w, h, r) {
    const radius = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    if (typeof ctx.roundRect === 'function') {
      ctx.roundRect(x, y, w, h, radius);
      return;
    }
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + w - radius, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
    ctx.lineTo(x + w, y + h - radius);
    ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
    ctx.lineTo(x + radius, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }

  #syncBodyState() {
    if (typeof document !== 'undefined' && document.body) {
      document.body.dataset.state = this.state;
    }
  }

  #syncHud() {
    if (this.headless) return;

    if (this.dom.scoreValue) {
      this.dom.scoreValue.textContent = String(this.score);
    }
    if (this.dom.bestValue) {
      this.dom.bestValue.textContent = String(this.bestScore);
    }

    if (this.dom.muteBtn) {
      this.dom.muteBtn.setAttribute('aria-pressed', String(this.muted));
      this.dom.muteBtn.setAttribute('aria-label', this.muted ? 'Unmute sound' : 'Mute sound');
    }
    if (this.dom.iconSoundOn && this.dom.iconSoundOff) {
      this.dom.iconSoundOn.hidden = this.muted;
      this.dom.iconSoundOff.hidden = !this.muted;
    }

    if (this.dom.pauseBtn) {
      const canPause =
        this.state === SnakeGame.STATES.PLAYING ||
        this.state === SnakeGame.STATES.PAUSED;
      const isPaused = this.state === SnakeGame.STATES.PAUSED;
      this.dom.pauseBtn.disabled = !canPause;
      this.dom.pauseBtn.setAttribute('aria-pressed', String(isPaused));
      this.dom.pauseBtn.setAttribute('aria-label', isPaused ? 'Resume game' : 'Pause game');
    }
    if (this.dom.iconPause && this.dom.iconPlay) {
      const isPaused = this.state === SnakeGame.STATES.PAUSED;
      this.dom.iconPause.hidden = isPaused;
      this.dom.iconPlay.hidden = !isPaused;
    }
  }

  #syncOverlay() {
    if (this.headless || !this.dom.overlay) return;

    const showOverlay = this.state !== SnakeGame.STATES.PLAYING;
    this.dom.overlay.hidden = !showOverlay;
    if (!showOverlay) return;

    if (this.state === SnakeGame.STATES.TITLE) {
      this.dom.overlayEmblem.hidden = false;
      this.dom.newBestBadge.hidden = true;
      this.dom.overlayStats.hidden = true;
      this.dom.secondaryCta.hidden = true;
      this.dom.overlayTitle.textContent = 'Orchard Snake';
      this.dom.overlaySubtitle.textContent =
        'Collect apples, grow longer, and avoid the walls and your own tail.';
      this.dom.primaryCta.textContent = this.spritesLoaded
        ? 'Start Game'
        : 'Loading Sprites...';
      this.dom.primaryCta.disabled = !this.spritesLoaded;
      this.dom.controlHints.textContent =
        'Arrows / WASD Move · Space / P Pause · Enter Start';
    } else if (this.state === SnakeGame.STATES.PAUSED) {
      this.dom.overlayEmblem.hidden = true;
      this.dom.newBestBadge.hidden = true;
      this.dom.overlayStats.hidden = false;
      this.dom.finalScoreValue.textContent = String(this.score);
      this.dom.finalBestValue.textContent = String(this.bestScore);
      this.dom.secondaryCta.hidden = false;
      this.dom.secondaryCta.textContent = 'Restart';
      this.dom.overlayTitle.textContent = 'Paused';
      this.dom.overlaySubtitle.textContent =
        'Take a breather. Ready when you are.';
      this.dom.primaryCta.textContent = 'Resume';
      this.dom.primaryCta.disabled = false;
      this.dom.controlHints.textContent =
        'Press Space or P to Resume';
    } else if (this.state === SnakeGame.STATES.GAME_OVER) {
      this.dom.overlayEmblem.hidden = true;
      this.dom.newBestBadge.hidden = !(this.isNewBest && this.score > 0);
      this.dom.overlayStats.hidden = false;
      this.dom.finalScoreValue.textContent = String(this.score);
      this.dom.finalBestValue.textContent = String(this.bestScore);
      this.dom.secondaryCta.hidden = true;
      this.dom.overlayTitle.textContent = this.isWin ? 'Orchard Mastered!' : 'Game Over';
      this.dom.overlaySubtitle.textContent = this.isWin
        ? 'You filled every tile on the board!'
        : 'You crashed! Try another run to beat your record.';
      this.dom.primaryCta.textContent = 'Play Again';
      this.dom.primaryCta.disabled = false;
      this.dom.controlHints.textContent =
        'Press Enter or Space to Play Again';
    }
  }

  #blurActiveElement() {
    if (typeof document !== 'undefined' && document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  }

  #getSafeStorage() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage;
      }
    } catch {
      return null;
    }
    return null;
  }

  #loadBestScore() {
    try {
      if (!this.storage) return 0;
      const raw = this.storage.getItem(SnakeGame.BEST_SCORE_KEY);
      const parsed = Number.parseInt(raw || '0', 10);
      return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
    } catch {
      return 0;
    }
  }

  #saveBestScore(value) {
    try {
      if (!this.storage) return;
      this.storage.setItem(SnakeGame.BEST_SCORE_KEY, String(value));
    } catch {
      // Ignore storage errors in private browsing mode
    }
  }

  #unlockAudio() {
    if (this.headless || typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      if (!this.audioCtx) {
        this.audioCtx = new AudioCtx();
      }
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume().catch(() => {});
      }
    } catch {
      // Ignore Web Audio errors when blocked
    }
  }

  #playTone(type) {
    if (this.headless || this.muted || !this.audioCtx) return;
    try {
      const ctx = this.audioCtx;
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }
      const now = ctx.currentTime;

      if (type === 'eat') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(523.25, now);
        osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.08);
        gain.gain.setValueAtTime(0.11, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.13);
      } else if (type === 'crash') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(210, now);
        osc.frequency.exponentialRampToValueAtTime(62, now + 0.24);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.26);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.27);
      } else if (type === 'win') {
        const notes = [523.25, 659.25, 783.99, 1046.5];
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const start = now + idx * 0.07;
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, start);
          gain.gain.setValueAtTime(0.1, start);
          gain.gain.exponentialRampToValueAtTime(0.001, start + 0.16);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(start);
          osc.stop(start + 0.17);
        });
      }
    } catch {
      // Ignore audio scheduling errors
    }
  }
}

if (typeof document !== 'undefined') {
  const boot = () => {
    const game = new SnakeGame();
    game.init();
  };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
}
