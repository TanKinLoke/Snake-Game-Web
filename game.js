export class SnakeGame {
  static GRID_SIZE = 20;
  static INITIAL_TICK_MS = 140;
  static MIN_TICK_MS = 75;
  static SPEED_STEP_MS = 2;
  static POINTS_PER_APPLE = 10;
  static GOLDEN_APPLE_POINTS = 25;
  static GOLDEN_APPLE_EVERY = 4;
  static GOLDEN_APPLE_DURATION_MS = 6500;
  static BEST_SCORE_KEY = 'snake_best_score';
  static BEST_SCORE_PREFIX = 'snake_best_score_';
  static DIFFICULTY_KEY = 'snake_difficulty';
  static LANGUAGE_KEY = 'snake_language';
  static HIGH_CONTRAST_KEY = 'snake_high_contrast';
  static SCREEN_SHAKE_KEY = 'snake_screen_shake';
  static PARTICLE_POOL_SIZE = 48;
  static SWIPE_THRESHOLD_PX = 30;
  static MAX_QUEUE_LENGTH = 2;

  static TRANSLATIONS = Object.freeze({
    en: Object.freeze({
      htmlLang: 'en',
      docTitle: 'Orchard Snake',
      scoreLabel: 'Score',
      bestHud: 'Best · {mode}',
      finalScoreLabel: 'Final Score',
      finalBestLabel: 'Best ({mode})',
      newBest: 'New Best!',
      switchLangButton: '中文',
      switchLangAria: 'Switch to Chinese',
      switchLangTitle: 'Switch language (EN / 中文)',
      muteAria: 'Mute sound',
      unmuteAria: 'Unmute sound',
      pauseAria: 'Pause game',
      resumeAria: 'Resume game',
      modes: Object.freeze({ casual: 'Casual', normal: 'Normal', hard: 'Hard' }),
      difficultyMeta: '{start}ms start · -{step}ms per apple · {min}ms cap',
      contrastLabel: 'High Contrast: {state}',
      shakeLabel: 'Screen Shake: {state}',
      on: 'On',
      off: 'Off',
      titleHeading: 'Orchard Snake',
      titleSubtitle: 'Collect apples, grab bonus golden apples, and avoid walls.',
      startCta: 'Start Game',
      loadingCta: 'Loading Sprites...',
      titleHints: 'Arrows / WASD Move · Space / P Pause · M Mute',
      pausedHeading: 'Paused',
      pausedSubtitle: 'Take a breather. Ready when you are.',
      resumeCta: 'Resume',
      restartCta: 'Restart',
      pausedHints: 'Press Space or P to Resume',
      gameOverHeading: 'Game Over',
      winHeading: 'Orchard Mastered!',
      gameOverSubtitle: 'You crashed! Better luck next run.',
      winSubtitle: 'You filled every tile on the board!',
      playAgainCta: 'Play Again',
      gameOverHints: 'Press Enter or Space to Play Again',
      dpadUp: 'Move Up',
      dpadDown: 'Move Down',
      dpadLeft: 'Move Left',
      dpadRight: 'Move Right',
    }),
    zh: Object.freeze({
      htmlLang: 'zh-CN',
      docTitle: '果园贪吃蛇',
      scoreLabel: '得分',
      bestHud: '最高 · {mode}',
      finalScoreLabel: '本局得分',
      finalBestLabel: '最高 ({mode})',
      newBest: '新纪录！',
      switchLangButton: 'EN',
      switchLangAria: '切换为英文',
      switchLangTitle: '切换语言 (中文 / EN)',
      muteAria: '静音',
      unmuteAria: '取消静音',
      pauseAria: '暂停游戏',
      resumeAria: '继续游戏',
      modes: Object.freeze({ casual: '休闲', normal: '普通', hard: '困难' }),
      difficultyMeta: '初始 {start}ms · 每果 -{step}ms · 最快 {min}ms',
      contrastLabel: '高对比度：{state}',
      shakeLabel: '屏幕震动：{state}',
      on: '开',
      off: '关',
      titleHeading: '果园贪吃蛇',
      titleSubtitle: '收集红苹果与限时金苹果，小心别撞墙或咬到自己。',
      startCta: '开始游戏',
      loadingCta: '正在加载...',
      titleHints: '方向键 / WASD 移动 · Space / P 暂停 · M 静音',
      pausedHeading: '已暂停',
      pausedSubtitle: '稍作休息，随时继续挑战。',
      resumeCta: '继续游戏',
      restartCta: '重新开始',
      pausedHints: '按 Space 或 P 键继续',
      gameOverHeading: '游戏结束',
      winHeading: '制霸果园！',
      gameOverSubtitle: '撞到障碍了，再来一局试试！',
      winSubtitle: '你已填满整个棋盘！',
      playAgainCta: '再来一局',
      gameOverHints: '按 Enter 或 Space 重新开始',
      dpadUp: '向上移动',
      dpadDown: '向下移动',
      dpadLeft: '向左移动',
      dpadRight: '向右移动',
    }),
  });

  static DIFFICULTIES = Object.freeze({
    casual: Object.freeze({
      id: 'casual',
      label: 'Casual',
      initialTickMs: 175,
      speedStepMs: 1,
      minTickMs: 95,
    }),
    normal: Object.freeze({
      id: 'normal',
      label: 'Normal',
      initialTickMs: 140,
      speedStepMs: 2,
      minTickMs: 75,
    }),
    hard: Object.freeze({
      id: 'hard',
      label: 'Hard',
      initialTickMs: 105,
      speedStepMs: 3,
      minTickMs: 55,
    }),
  });

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

  static GOLDEN_APPLE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
    <path d="M32 16c-5-4.8-13.2-4.2-17.6 1.2-4.8 5.8-4.8 17-.4 26 3.3 6.8 8.3 12 13.4 12 2.2 0 3.6-.8 4.6-.8s2.4.8 4.6.8c5.1 0 10.1-5.2 13.4-12 4.4-9 4.4-20.2-.4-26C45.2 11.8 37 11.2 32 16z" fill="#facc15" stroke="#854d0e" stroke-width="3" stroke-linejoin="round"/>
    <path d="M32 15.5c0-5.4 2.8-9.2 6.6-10.6" fill="none" stroke="#a16207" stroke-width="3.8" stroke-linecap="round"/>
    <path d="M33 13.5c4.6-4.8 11.4-5.4 14.2-1.2-3 4-9 5.2-14.2 1.2z" fill="#86efac" stroke="#14532d" stroke-width="2" stroke-linejoin="round"/>
    <ellipse cx="22.5" cy="27.5" rx="3.5" ry="6.8" transform="rotate(-18 22.5 27.5)" fill="#fef9c3" opacity="0.88"/>
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

  static SNAKE_HEAD_HC_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
    <path d="M51 32h10l3-3.5M61 32l3 3.5" fill="none" stroke="#fb923c" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>
    <rect x="6" y="8" width="48" height="48" rx="18" fill="#38bdf8" stroke="#ffffff" stroke-width="3.2"/>
    <rect x="12" y="13" width="32" height="10" rx="5" fill="#e0f2fe" opacity="0.4"/>
    <circle cx="38" cy="20" r="6.5" fill="#ffffff" stroke="#020617" stroke-width="2.2"/>
    <circle cx="38" cy="44" r="6.5" fill="#ffffff" stroke="#020617" stroke-width="2.2"/>
    <circle cx="40" cy="20" r="3.2" fill="#020617"/>
    <circle cx="40" cy="44" r="3.2" fill="#020617"/>
    <circle cx="39" cy="18.8" r="1.1" fill="#ffffff"/>
    <circle cx="39" cy="42.8" r="1.1" fill="#ffffff"/>
  </svg>`;

  constructor(options = {}) {
    this.headless = Boolean(options.headless);
    this.storage = options.storage !== undefined ? options.storage : this.#getSafeStorage();
    this.rng = typeof options.rng === 'function' ? options.rng : Math.random;

    this.state = SnakeGame.STATES.TITLE;
    this.language = this.#resolveLanguage(options.language || this.#loadLanguage());
    this.difficulty = this.#resolveDifficulty(options.difficulty || this.#loadDifficulty());
    this.score = 0;
    this.bestScores = this.#loadAllBestScores();
    this.bestScore = this.bestScores[this.difficulty] || 0;
    this.runStartBestScore = this.bestScore;
    this.isNewBest = false;
    this.isWin = false;
    this.muted = false;
    this.highContrast = this.#loadBooleanSetting(SnakeGame.HIGH_CONTRAST_KEY, false);
    this.screenShake = this.#loadBooleanSetting(
      SnakeGame.SCREEN_SHAKE_KEY,
      !this.#prefersReducedMotion()
    );
    this.spritesLoaded = false;

    this.snake = [];
    this.direction = SnakeGame.DIRECTIONS.RIGHT;
    this.inputQueue = [];
    this.apple = { x: 14, y: 10 };
    this.goldenApple = null;
    this.applesEaten = 0;
    this.tickIntervalMs = this.computeTickInterval(0);
    this.accumulatorMs = 0;
    this.lastFrameTime = 0;
    this.rafId = null;
    this.fxRafId = null;

    this.particles = Array.from({ length: SnakeGame.PARTICLE_POOL_SIZE }, () => ({
      active: false,
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      lifeMs: 0,
      maxLifeMs: 1,
      size: 3,
      color: '#ffffff',
    }));
    this.particleCursor = 0;
    this.shakeTrauma = 0;

    this.audioCtx = null;
    this.sprites = { apple: null, goldenApple: null, head: null, headHc: null };
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
    this.#applyHighContrastClass();
    this.#applyDocumentLanguage();
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
    this.bestScore = this.bestScores[this.difficulty] || 0;
    this.tickIntervalMs = this.computeTickInterval(0);
    this.accumulatorMs = 0;
    this.isNewBest = false;
    this.isWin = false;
    this.goldenApple = null;
    this.shakeTrauma = 0;
    for (const p of this.particles) {
      p.active = false;
    }
    this.apple = this.spawnApple();
  }

  startGame(fromUserGesture = true) {
    if (!this.headless && !this.spritesLoaded) {
      return;
    }
    if (fromUserGesture) {
      this.#unlockAudio();
    }
    this.bestScore = this.bestScores[this.difficulty] || 0;
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

  getDifficultyConfig(mode = this.difficulty) {
    return SnakeGame.DIFFICULTIES[mode] || SnakeGame.DIFFICULTIES.normal;
  }

  setDifficulty(mode) {
    if (!Object.prototype.hasOwnProperty.call(SnakeGame.DIFFICULTIES, mode)) {
      return false;
    }
    this.difficulty = mode;
    this.#saveDifficulty(mode);
    this.bestScore = this.bestScores[mode] || 0;
    this.tickIntervalMs = this.computeTickInterval(this.applesEaten);
    this.#syncHud();
    this.#syncOverlay();
    return true;
  }

  toggleHighContrast() {
    this.highContrast = !this.highContrast;
    this.#saveBooleanSetting(SnakeGame.HIGH_CONTRAST_KEY, this.highContrast);
    this.#applyHighContrastClass();
    this.#syncOverlay();
    this.#render(performance.now());
  }

  toggleScreenShake() {
    this.screenShake = !this.screenShake;
    this.#saveBooleanSetting(SnakeGame.SCREEN_SHAKE_KEY, this.screenShake);
    this.#syncOverlay();
  }

  getStrings() {
    return SnakeGame.TRANSLATIONS[this.language] || SnakeGame.TRANSLATIONS.en;
  }

  setLanguage(lang) {
    if (!Object.prototype.hasOwnProperty.call(SnakeGame.TRANSLATIONS, lang)) {
      return false;
    }
    this.language = lang;
    this.#saveLanguage(lang);
    this.#applyDocumentLanguage();
    this.#syncHud();
    this.#syncOverlay();
    return true;
  }

  toggleLanguage() {
    this.setLanguage(this.language === 'zh' ? 'en' : 'zh');
  }

  computeTickInterval(applesEaten, mode = this.difficulty) {
    const cfg = this.getDifficultyConfig(mode);
    return Math.max(
      cfg.minTickMs,
      cfg.initialTickMs - applesEaten * cfg.speedStepMs
    );
  }

  spawnApple(excludeCell = this.goldenApple) {
    const occupied = new Set(this.snake.map((seg) => `${seg.x},${seg.y}`));
    if (excludeCell) {
      occupied.add(`${excludeCell.x},${excludeCell.y}`);
    }
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

  spawnGoldenApple() {
    const cell = this.spawnApple(this.apple);
    if (!cell) return null;
    return {
      x: cell.x,
      y: cell.y,
      remainingMs: SnakeGame.GOLDEN_APPLE_DURATION_MS,
      durationMs: SnakeGame.GOLDEN_APPLE_DURATION_MS,
    };
  }

  emitParticles(gridX, gridY, color, count = 10) {
    if (this.headless) return;
    for (let i = 0; i < count; i += 1) {
      const slot = this.particles[this.particleCursor];
      this.particleCursor = (this.particleCursor + 1) % this.particles.length;

      const angle = (Math.PI * 2 * i) / count + (this.rng() - 0.5) * 0.5;
      const speed = 1.6 + this.rng() * 3.0;
      slot.active = true;
      slot.x = gridX + 0.5;
      slot.y = gridY + 0.5;
      slot.vx = Math.cos(angle) * speed;
      slot.vy = Math.sin(angle) * speed;
      slot.maxLifeMs = 280 + this.rng() * 180;
      slot.lifeMs = slot.maxLifeMs;
      slot.size = 2.6 + this.rng() * 2.2;
      slot.color = color;
    }
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
      this.emitParticles(head.x, head.y, '#fca5a5', 16);
      this.#finishGame(false);
      return false;
    }

    const ateRegular =
      this.apple !== null &&
      nextHead.x === this.apple.x &&
      nextHead.y === this.apple.y;

    const ateGolden =
      this.goldenApple !== null &&
      nextHead.x === this.goldenApple.x &&
      nextHead.y === this.goldenApple.y;

    const willEat = ateRegular || ateGolden;

    const collisionLimit = willEat ? this.snake.length : this.snake.length - 1;
    for (let i = 0; i < collisionLimit; i += 1) {
      if (this.snake[i].x === nextHead.x && this.snake[i].y === nextHead.y) {
        this.emitParticles(head.x, head.y, '#fca5a5', 16);
        this.#finishGame(false);
        return false;
      }
    }

    this.snake.unshift(nextHead);

    if (willEat) {
      if (ateRegular) {
        this.score += SnakeGame.POINTS_PER_APPLE;
        this.applesEaten += 1;
        this.tickIntervalMs = this.computeTickInterval(this.applesEaten);
        this.emitParticles(
          nextHead.x,
          nextHead.y,
          this.highContrast ? '#fb923c' : '#ef4444',
          10
        );
      }

      if (ateGolden) {
        this.score += SnakeGame.GOLDEN_APPLE_POINTS;
        this.goldenApple = null;
        this.emitParticles(nextHead.x, nextHead.y, '#fde047', 16);
      }

      const currentBest = this.bestScores[this.difficulty] || 0;
      if (this.score > currentBest) {
        this.bestScores[this.difficulty] = this.score;
        this.bestScore = this.score;
        this.#saveBestScoreForDifficulty(this.difficulty, this.score);
      }
      if (this.score > this.runStartBestScore) {
        this.isNewBest = true;
      }

      if (this.snake.length >= SnakeGame.GRID_SIZE * SnakeGame.GRID_SIZE) {
        this.apple = null;
        this.goldenApple = null;
        this.#playTone('win');
        this.#finishGame(true);
        return true;
      }

      if (ateRegular) {
        this.apple = this.spawnApple(this.goldenApple);
        if (
          this.applesEaten % SnakeGame.GOLDEN_APPLE_EVERY === 0 &&
          !this.goldenApple
        ) {
          this.goldenApple = this.spawnGoldenApple();
        }
      }

      this.#playTone(ateGolden ? 'golden' : 'eat');
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
      if (this.screenShake && !this.headless) {
        this.shakeTrauma = 1;
      }
      this.#startPostFxLoop();
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
    if (this.fxRafId !== null && typeof cancelAnimationFrame === 'function') {
      cancelAnimationFrame(this.fxRafId);
      this.fxRafId = null;
    }
  }

  #startPostFxLoop() {
    if (this.headless || typeof requestAnimationFrame !== 'function') return;
    let last = performance.now();
    const tickFx = (now) => {
      if (this.state === SnakeGame.STATES.PLAYING) {
        this.fxRafId = null;
        return;
      }
      const dt = Math.min(Math.max(now - last, 0), 50);
      last = now;
      const stillActive = this.#updateVisualEffects(dt);
      this.#render(now);
      if (stillActive) {
        this.fxRafId = requestAnimationFrame(tickFx);
      } else {
        this.fxRafId = null;
      }
    };
    this.fxRafId = requestAnimationFrame(tickFx);
  }

  #updateVisualEffects(dtMs) {
    let anyActive = false;
    const dtSec = dtMs / 1000;

    if (this.shakeTrauma > 0) {
      this.shakeTrauma = Math.max(0, this.shakeTrauma - dtMs / 240);
      if (this.shakeTrauma > 0) anyActive = true;
    }

    for (const p of this.particles) {
      if (!p.active) continue;
      p.lifeMs -= dtMs;
      if (p.lifeMs <= 0) {
        p.active = false;
        continue;
      }
      p.x += p.vx * dtSec;
      p.y += p.vy * dtSec;
      p.vx *= 0.94;
      p.vy *= 0.94;
      anyActive = true;
    }

    return anyActive;
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

    if (this.goldenApple) {
      this.goldenApple.remainingMs -= clampedDelta;
      if (this.goldenApple.remainingMs <= 0) {
        this.goldenApple = null;
      }
    }

    this.#updateVisualEffects(clampedDelta);

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
      scoreLabel: document.getElementById('score-label'),
      scoreValue: document.getElementById('score-value'),
      bestLabel: document.getElementById('best-label'),
      bestValue: document.getElementById('best-value'),
      langBtn: document.getElementById('lang-btn'),
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
      finalScoreLabel: document.getElementById('final-score-label'),
      finalScoreValue: document.getElementById('final-score-value'),
      finalBestLabel: document.getElementById('final-best-label'),
      finalBestValue: document.getElementById('final-best-value'),
      primaryCta: document.getElementById('primary-cta'),
      secondaryCta: document.getElementById('secondary-cta'),
      difficultyPicker: document.getElementById('difficulty-picker'),
      difficultyMeta: document.getElementById('difficulty-meta'),
      difficultyButtons: Array.from(document.querySelectorAll('.difficulty-btn')),
      visualOptions: document.getElementById('visual-options'),
      contrastToggle: document.getElementById('contrast-toggle'),
      shakeToggle: document.getElementById('shake-toggle'),
      controlHints: document.getElementById('control-hints'),
      dpadButtons: Array.from(document.querySelectorAll('.dpad-btn')),
    };
    if (this.dom.canvas) {
      this.ctx = this.dom.canvas.getContext('2d');
    }
  }

  #bindEvents() {
    window.addEventListener('resize', this.#boundHandlers.resize);
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', this.#boundHandlers.resize);
    }
    window.addEventListener('keydown', this.#boundHandlers.keydown);
    document.addEventListener('visibilitychange', this.#boundHandlers.visibilitychange);

    if (this.dom.langBtn) {
      this.dom.langBtn.addEventListener('click', () => {
        this.toggleLanguage();
        this.dom.langBtn.blur();
      });
    }

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

    if (this.dom.contrastToggle) {
      this.dom.contrastToggle.addEventListener('click', () => {
        this.toggleHighContrast();
        this.dom.contrastToggle.blur();
      });
    }

    if (this.dom.shakeToggle) {
      this.dom.shakeToggle.addEventListener('click', () => {
        this.toggleScreenShake();
        this.dom.shakeToggle.blur();
      });
    }

    for (const btn of this.dom.difficultyButtons) {
      btn.addEventListener('click', () => {
        this.#unlockAudio();
        this.setDifficulty(btn.dataset.difficulty);
        btn.blur();
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
    const stageRect = this.dom.boardStage.getBoundingClientRect();
    const framePadding = 14;
    const viewportWidth = window.visualViewport ? window.visualViewport.width : window.innerWidth;
    const viewportHeight = window.visualViewport ? window.visualViewport.height : window.innerHeight;

    const availW = Math.min(stageRect.width - framePadding, viewportWidth - 20);
    const availH = Math.min(stageRect.height - framePadding, viewportHeight - 20);
    const maxDimension = Math.min(availW, availH, 588);
    const clamped = Math.max(160, maxDimension);
    const snapped = Math.floor(clamped / SnakeGame.GRID_SIZE) * SnakeGame.GRID_SIZE;
    const size = Math.max(160, Math.min(snapped, clamped));

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
      loadImage(SnakeGame.GOLDEN_APPLE_SVG),
      loadImage(SnakeGame.SNAKE_HEAD_SVG),
      loadImage(SnakeGame.SNAKE_HEAD_HC_SVG),
    ]).then(([appleImg, goldenAppleImg, headImg, headHcImg]) => {
      this.sprites.apple = appleImg;
      this.sprites.goldenApple = goldenAppleImg;
      this.sprites.head = headImg;
      this.sprites.headHc = headHcImg;
    });
  }

  #render(now = 0) {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const size = this.canvasSize;
    const cell = size / SnakeGame.GRID_SIZE;
    const hc = this.highContrast;

    let shakeX = 0;
    let shakeY = 0;
    if (this.shakeTrauma > 0 && this.screenShake) {
      const mag = this.shakeTrauma * this.shakeTrauma * 6;
      shakeX = Math.sin(now * 0.08) * mag;
      shakeY = Math.cos(now * 0.11) * mag;
    }

    ctx.save();
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.fillStyle = hc ? '#090f1d' : '#15271e';
    ctx.fillRect(0, 0, size, size);
    ctx.translate(shakeX, shakeY);

    // 1. Two-tone checkerboard grid
    const tileEven = hc ? '#0f172a' : '#1b3126';
    const tileOdd = hc ? '#17253d' : '#223b2f';
    for (let y = 0; y < SnakeGame.GRID_SIZE; y += 1) {
      for (let x = 0; x < SnakeGame.GRID_SIZE; x += 1) {
        ctx.fillStyle = (x + y) % 2 === 0 ? tileEven : tileOdd;
        ctx.fillRect(x * cell, y * cell, cell, cell);
      }
    }

    // 2. Regular Apple sprite
    if (this.apple) {
      const cx = (this.apple.x + 0.5) * cell;
      const cy = (this.apple.y + 0.5) * cell;
      const pulse =
        this.state === SnakeGame.STATES.PLAYING
          ? 0.94 + 0.06 * Math.sin(now * 0.006)
          : 0.96;
      const drawSize = cell * pulse;

      if (hc) {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(cx, cy, cell * 0.44, 0, Math.PI * 2);
        ctx.stroke();
      }

      if (this.sprites.apple) {
        ctx.drawImage(
          this.sprites.apple,
          cx - drawSize / 2,
          cy - drawSize / 2,
          drawSize,
          drawSize
        );
      } else {
        ctx.fillStyle = hc ? '#fb923c' : '#ef4444';
        ctx.beginPath();
        ctx.arc(cx, cy, drawSize * 0.4, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 2b. Timed Bonus Golden Apple with countdown ring
    if (this.goldenApple) {
      const gx = (this.goldenApple.x + 0.5) * cell;
      const gy = (this.goldenApple.y + 0.5) * cell;
      const ratio = Math.max(0, this.goldenApple.remainingMs / this.goldenApple.durationMs);
      const pulse = 0.9 + 0.08 * Math.sin(now * 0.012);
      const drawSize = cell * pulse;

      ctx.strokeStyle = 'rgba(250, 204, 21, 0.25)';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(gx, gy, cell * 0.46, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = '#fde047';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(
        gx,
        gy,
        cell * 0.46,
        -Math.PI / 2,
        -Math.PI / 2 + Math.PI * 2 * ratio
      );
      ctx.stroke();

      if (this.sprites.goldenApple) {
        ctx.drawImage(
          this.sprites.goldenApple,
          gx - drawSize / 2,
          gy - drawSize / 2,
          drawSize,
          drawSize
        );
      } else {
        ctx.fillStyle = '#facc15';
        ctx.beginPath();
        ctx.arc(gx, gy, drawSize * 0.38, 0, Math.PI * 2);
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

      if (hc) {
        ctx.fillStyle = i % 2 === 0 ? '#38bdf8' : '#0284c7';
      } else {
        ctx.fillStyle = i % 2 === 0 ? '#22c55e' : '#16a34a';
      }
      this.#drawRoundedRect(
        ctx,
        seg.x * cell + inset,
        seg.y * cell + inset,
        segSize,
        segSize,
        radius
      );
      ctx.fill();

      ctx.strokeStyle = hc ? '#ffffff' : 'rgba(5, 46, 22, 0.38)';
      ctx.lineWidth = hc ? 1.5 : 1;
      ctx.stroke();

      if (!isTail) {
        ctx.fillStyle = hc ? 'rgba(224, 242, 254, 0.22)' : 'rgba(187, 247, 208, 0.14)';
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
      const headImg = hc ? this.sprites.headHc : this.sprites.head;

      ctx.save();
      ctx.translate(hx, hy);
      ctx.rotate(this.direction.angle);
      if (headImg) {
        ctx.drawImage(
          headImg,
          -headSize / 2,
          -headSize / 2,
          headSize,
          headSize
        );
      } else {
        ctx.fillStyle = hc ? '#38bdf8' : '#22c55e';
        this.#drawRoundedRect(ctx, -cell * 0.45, -cell * 0.45, cell * 0.9, cell * 0.9, cell * 0.3);
        ctx.fill();
      }
      ctx.restore();
    }

    // 5. Pooled particles
    for (const p of this.particles) {
      if (!p.active) continue;
      const alpha = Math.max(0, p.lifeMs / p.maxLifeMs);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x * cell, p.y * cell, p.size * (0.6 + 0.4 * alpha), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

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
    const cfg = this.getDifficultyConfig();
    const t = this.getStrings();
    const modeLabel = t.modes[cfg.id] || cfg.label;

    if (this.dom.scoreLabel) {
      this.dom.scoreLabel.textContent = t.scoreLabel;
    }
    if (this.dom.scoreValue) {
      this.dom.scoreValue.textContent = String(this.score);
    }
    if (this.dom.bestLabel) {
      this.dom.bestLabel.textContent = t.bestHud.replace('{mode}', modeLabel);
    }
    if (this.dom.bestValue) {
      this.dom.bestValue.textContent = String(this.bestScore);
    }

    if (this.dom.langBtn) {
      this.dom.langBtn.textContent = t.switchLangButton;
      this.dom.langBtn.setAttribute('aria-label', t.switchLangAria);
      this.dom.langBtn.setAttribute('title', t.switchLangTitle);
    }

    if (this.dom.muteBtn) {
      this.dom.muteBtn.setAttribute('aria-pressed', String(this.muted));
      this.dom.muteBtn.setAttribute('aria-label', this.muted ? t.unmuteAria : t.muteAria);
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
      this.dom.pauseBtn.setAttribute('aria-label', isPaused ? t.resumeAria : t.pauseAria);
    }
    if (this.dom.iconPause && this.dom.iconPlay) {
      const isPaused = this.state === SnakeGame.STATES.PAUSED;
      this.dom.iconPause.hidden = isPaused;
      this.dom.iconPlay.hidden = !isPaused;
    }

    if (this.dom.dpadButtons) {
      const dirLabels = {
        UP: t.dpadUp,
        DOWN: t.dpadDown,
        LEFT: t.dpadLeft,
        RIGHT: t.dpadRight,
      };
      for (const btn of this.dom.dpadButtons) {
        const label = dirLabels[btn.dataset.dir];
        if (label) {
          btn.setAttribute('aria-label', label);
        }
      }
    }
  }

  #syncOverlay() {
    if (this.headless || !this.dom.overlay) return;

    const showOverlay = this.state !== SnakeGame.STATES.PLAYING;
    this.dom.overlay.hidden = !showOverlay;
    if (!showOverlay) return;

    this.#syncDifficultyUi();
    this.#syncVisualOptionsUi();
    const cfg = this.getDifficultyConfig();
    const t = this.getStrings();
    const modeLabel = t.modes[cfg.id] || cfg.label;

    if (this.dom.newBestBadge) {
      this.dom.newBestBadge.textContent = t.newBest;
    }
    if (this.dom.finalScoreLabel) {
      this.dom.finalScoreLabel.textContent = t.finalScoreLabel;
    }

    if (this.state === SnakeGame.STATES.TITLE) {
      this.dom.overlayEmblem.hidden = false;
      this.dom.newBestBadge.hidden = true;
      this.dom.overlayStats.hidden = true;
      if (this.dom.difficultyPicker) this.dom.difficultyPicker.hidden = false;
      if (this.dom.visualOptions) this.dom.visualOptions.hidden = false;
      this.dom.secondaryCta.hidden = true;
      this.dom.overlayTitle.textContent = t.titleHeading;
      this.dom.overlaySubtitle.textContent = t.titleSubtitle;
      this.dom.primaryCta.textContent = this.spritesLoaded ? t.startCta : t.loadingCta;
      this.dom.primaryCta.disabled = !this.spritesLoaded;
      this.dom.controlHints.textContent = t.titleHints;
    } else if (this.state === SnakeGame.STATES.PAUSED) {
      this.dom.overlayEmblem.hidden = true;
      this.dom.newBestBadge.hidden = true;
      this.dom.overlayStats.hidden = false;
      if (this.dom.difficultyPicker) this.dom.difficultyPicker.hidden = true;
      if (this.dom.visualOptions) this.dom.visualOptions.hidden = false;
      this.dom.finalScoreValue.textContent = String(this.score);
      if (this.dom.finalBestLabel) {
        this.dom.finalBestLabel.textContent = t.finalBestLabel.replace('{mode}', modeLabel);
      }
      this.dom.finalBestValue.textContent = String(this.bestScore);
      this.dom.secondaryCta.hidden = false;
      this.dom.secondaryCta.textContent = t.restartCta;
      this.dom.overlayTitle.textContent = t.pausedHeading;
      this.dom.overlaySubtitle.textContent = t.pausedSubtitle;
      this.dom.primaryCta.textContent = t.resumeCta;
      this.dom.primaryCta.disabled = false;
      this.dom.controlHints.textContent = t.pausedHints;
    } else if (this.state === SnakeGame.STATES.GAME_OVER) {
      this.dom.overlayEmblem.hidden = true;
      this.dom.newBestBadge.hidden = !(this.isNewBest && this.score > 0);
      this.dom.overlayStats.hidden = false;
      if (this.dom.difficultyPicker) this.dom.difficultyPicker.hidden = false;
      if (this.dom.visualOptions) this.dom.visualOptions.hidden = true;
      this.dom.finalScoreValue.textContent = String(this.score);
      if (this.dom.finalBestLabel) {
        this.dom.finalBestLabel.textContent = t.finalBestLabel.replace('{mode}', modeLabel);
      }
      this.dom.finalBestValue.textContent = String(this.bestScore);
      this.dom.secondaryCta.hidden = true;
      this.dom.overlayTitle.textContent = this.isWin ? t.winHeading : t.gameOverHeading;
      this.dom.overlaySubtitle.textContent = this.isWin ? t.winSubtitle : t.gameOverSubtitle;
      this.dom.primaryCta.textContent = t.playAgainCta;
      this.dom.primaryCta.disabled = false;
      this.dom.controlHints.textContent = t.gameOverHints;
    }
  }

  #syncDifficultyUi() {
    if (this.headless) return;
    const cfg = this.getDifficultyConfig();
    const t = this.getStrings();
    if (this.dom.difficultyButtons) {
      for (const btn of this.dom.difficultyButtons) {
        const modeId = btn.dataset.difficulty;
        const isSelected = modeId === cfg.id;
        btn.setAttribute('aria-pressed', String(isSelected));
        if (modeId && t.modes[modeId]) {
          btn.textContent = t.modes[modeId];
        }
      }
    }
    if (this.dom.difficultyMeta) {
      this.dom.difficultyMeta.textContent = t.difficultyMeta
        .replace('{start}', String(cfg.initialTickMs))
        .replace('{step}', String(cfg.speedStepMs))
        .replace('{min}', String(cfg.minTickMs));
    }
  }

  #syncVisualOptionsUi() {
    if (this.headless) return;
    const t = this.getStrings();
    if (this.dom.contrastToggle) {
      this.dom.contrastToggle.setAttribute('aria-pressed', String(this.highContrast));
      this.dom.contrastToggle.textContent = t.contrastLabel.replace(
        '{state}',
        this.highContrast ? t.on : t.off
      );
    }
    if (this.dom.shakeToggle) {
      this.dom.shakeToggle.setAttribute('aria-pressed', String(this.screenShake));
      this.dom.shakeToggle.textContent = t.shakeLabel.replace(
        '{state}',
        this.screenShake ? t.on : t.off
      );
    }
  }

  #applyHighContrastClass() {
    if (this.headless || typeof document === 'undefined' || !document.body) return;
    document.body.classList.toggle('high-contrast', this.highContrast);
  }

  #applyDocumentLanguage() {
    if (this.headless || typeof document === 'undefined') return;
    const t = this.getStrings();
    if (document.documentElement) {
      document.documentElement.lang = t.htmlLang;
    }
    document.title = t.docTitle;
  }

  #blurActiveElement() {
    if (typeof document !== 'undefined' && document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  }

  #prefersReducedMotion() {
    try {
      return (
        typeof window !== 'undefined' &&
        typeof window.matchMedia === 'function' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches
      );
    } catch {
      return false;
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

  #loadAllBestScores() {
    const scores = { casual: 0, normal: 0, hard: 0 };
    for (const mode of Object.keys(SnakeGame.DIFFICULTIES)) {
      scores[mode] = this.#loadBestScoreForDifficulty(mode);
    }
    if (scores.normal === 0) {
      const legacy = this.#loadLegacyBestScore();
      if (legacy > 0) {
        scores.normal = legacy;
      }
    }
    return scores;
  }

  #loadLegacyBestScore() {
    try {
      if (!this.storage) return 0;
      const raw = this.storage.getItem(SnakeGame.BEST_SCORE_KEY);
      const parsed = Number.parseInt(raw || '0', 10);
      return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
    } catch {
      return 0;
    }
  }

  #loadBestScoreForDifficulty(mode) {
    try {
      if (!this.storage) return 0;
      const raw = this.storage.getItem(`${SnakeGame.BEST_SCORE_PREFIX}${mode}`);
      const parsed = Number.parseInt(raw || '0', 10);
      return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
    } catch {
      return 0;
    }
  }

  #saveBestScoreForDifficulty(mode, value) {
    try {
      if (!this.storage) return;
      this.storage.setItem(`${SnakeGame.BEST_SCORE_PREFIX}${mode}`, String(value));
      if (mode === 'normal') {
        this.storage.setItem(SnakeGame.BEST_SCORE_KEY, String(value));
      }
    } catch {
      // Ignore storage errors in private browsing mode
    }
  }

  #resolveDifficulty(mode) {
    return Object.prototype.hasOwnProperty.call(SnakeGame.DIFFICULTIES, mode)
      ? mode
      : 'normal';
  }

  #loadDifficulty() {
    try {
      if (!this.storage) return 'normal';
      return this.#resolveDifficulty(this.storage.getItem(SnakeGame.DIFFICULTY_KEY));
    } catch {
      return 'normal';
    }
  }

  #saveDifficulty(mode) {
    try {
      if (!this.storage) return;
      this.storage.setItem(SnakeGame.DIFFICULTY_KEY, mode);
    } catch {
      // Ignore storage errors in private browsing mode
    }
  }

  #resolveLanguage(lang) {
    return Object.prototype.hasOwnProperty.call(SnakeGame.TRANSLATIONS, lang) ? lang : 'en';
  }

  #loadLanguage() {
    try {
      if (!this.storage) return 'en';
      return this.#resolveLanguage(this.storage.getItem(SnakeGame.LANGUAGE_KEY));
    } catch {
      return 'en';
    }
  }

  #saveLanguage(lang) {
    try {
      if (!this.storage) return;
      this.storage.setItem(SnakeGame.LANGUAGE_KEY, lang);
    } catch {
      // Ignore storage errors in private browsing mode
    }
  }

  #loadBooleanSetting(key, fallback) {
    try {
      if (!this.storage) return fallback;
      const raw = this.storage.getItem(key);
      if (raw === 'true') return true;
      if (raw === 'false') return false;
      return fallback;
    } catch {
      return fallback;
    }
  }

  #saveBooleanSetting(key, value) {
    try {
      if (!this.storage) return;
      this.storage.setItem(key, String(Boolean(value)));
    } catch {
      // Ignore storage errors
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
      } else if (type === 'golden') {
        const notes = [659.25, 880, 1174.66];
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const start = now + idx * 0.045;
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, start);
          gain.gain.setValueAtTime(0.11, start);
          gain.gain.exponentialRampToValueAtTime(0.001, start + 0.14);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(start);
          osc.stop(start + 0.15);
        });
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
