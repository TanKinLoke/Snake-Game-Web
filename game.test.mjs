import test from 'node:test';
import assert from 'node:assert/strict';
import { SnakeGame } from './game.js';

function createMemoryStorage(initial = {}) {
  const map = new Map(Object.entries(initial));
  return {
    getItem: (key) => (map.has(key) ? map.get(key) : null),
    setItem: (key, val) => {
      map.set(key, String(val));
    },
  };
}

test('initial state and speed calculation follow spec', () => {
  const game = new SnakeGame({ headless: true, storage: createMemoryStorage() });
  assert.equal(game.state, SnakeGame.STATES.TITLE);
  assert.equal(game.snake.length, 3);
  assert.equal(game.tickIntervalMs, 140);
  assert.equal(game.computeTickInterval(0), 140);
  assert.equal(game.computeTickInterval(1), 138);
  assert.equal(game.computeTickInterval(10), 120);
  assert.equal(game.computeTickInterval(33), 75);
  assert.equal(game.computeTickInterval(100), 75);
});

test('direction input queue buffers up to 2 turns and blocks 180-degree reversal', () => {
  const game = new SnakeGame({ headless: true, storage: createMemoryStorage() });
  game.startGame();
  assert.equal(game.direction, SnakeGame.DIRECTIONS.RIGHT);

  // Direct 180 reversal from RIGHT to LEFT is rejected
  assert.equal(game.enqueueDirection(SnakeGame.DIRECTIONS.LEFT), false);

  // Rapid double-tap UP then LEFT within one tick is accepted (2 items)
  assert.equal(game.enqueueDirection(SnakeGame.DIRECTIONS.UP), true);
  assert.equal(game.enqueueDirection(SnakeGame.DIRECTIONS.LEFT), true);

  // 3rd buffered input is rejected because max queue length is 2
  assert.equal(game.enqueueDirection(SnakeGame.DIRECTIONS.DOWN), false);

  const startHead = { ...game.snake[0] };
  assert.equal(game.step(), true);
  assert.equal(game.direction, SnakeGame.DIRECTIONS.UP);
  assert.deepEqual(game.snake[0], { x: startHead.x, y: startHead.y - 1 });

  assert.equal(game.step(), true);
  assert.equal(game.direction, SnakeGame.DIRECTIONS.LEFT);
  assert.deepEqual(game.snake[0], { x: startHead.x - 1, y: startHead.y - 1 });
});

test('eating apple increments score by 10, grows snake, updates speed and best score', () => {
  const storage = createMemoryStorage({ snake_best_score: '0' });
  const game = new SnakeGame({ headless: true, storage });
  game.startGame();

  const head = game.snake[0];
  game.apple = { x: head.x + 1, y: head.y };

  const alive = game.step();
  assert.equal(alive, true);
  assert.equal(game.score, 10);
  assert.equal(game.bestScore, 10);
  assert.equal(game.isNewBest, true);
  assert.equal(game.snake.length, 4);
  assert.equal(game.tickIntervalMs, 138);
  assert.equal(storage.getItem('snake_best_score'), '10');
});

test('wall collision and self collision transition immediately to gameover', () => {
  const game = new SnakeGame({ headless: true, storage: createMemoryStorage() });
  game.startGame();

  // Wall collision on right edge
  game.snake = [
    { x: 19, y: 10 },
    { x: 18, y: 10 },
    { x: 17, y: 10 },
  ];
  game.direction = SnakeGame.DIRECTIONS.RIGHT;
  game.apple = { x: 0, y: 0 };
  assert.equal(game.step(), false);
  assert.equal(game.state, SnakeGame.STATES.GAME_OVER);
  assert.equal(game.isWin, false);

  // Self collision
  game.startGame();
  game.snake = [
    { x: 5, y: 5 },
    { x: 6, y: 5 },
    { x: 6, y: 6 },
    { x: 5, y: 6 },
    { x: 4, y: 6 },
    { x: 4, y: 5 },
  ];
  game.direction = SnakeGame.DIRECTIONS.DOWN;
  game.apple = { x: 0, y: 0 };
  assert.equal(game.step(), false);
  assert.equal(game.state, SnakeGame.STATES.GAME_OVER);
});

test('apple spawns strictly on unoccupied cells and filling 400 cells wins', () => {
  const game = new SnakeGame({ headless: true, storage: createMemoryStorage() });
  game.startGame();

  // Fill 399 cells, leaving only (19, 19) unoccupied
  const cells = [];
  for (let y = 0; y < 20; y += 1) {
    for (let x = 0; x < 20; x += 1) {
      if (!(x === 19 && y === 19)) {
        cells.push({ x, y });
      }
    }
  }
  // Put head at (18, 19) so moving RIGHT eats at (19, 19)
  game.snake = cells.reverse();
  assert.deepEqual(game.snake[0], { x: 18, y: 19 });

  const spawned = game.spawnApple();
  assert.deepEqual(spawned, { x: 19, y: 19 });

  game.apple = spawned;
  game.direction = SnakeGame.DIRECTIONS.RIGHT;
  const result = game.step();
  assert.equal(result, true);
  assert.equal(game.snake.length, 400);
  assert.equal(game.state, SnakeGame.STATES.GAME_OVER);
  assert.equal(game.isWin, true);
  assert.equal(game.apple, null);
});

test('storage errors in private browsing are safely ignored', () => {
  const brokenStorage = {
    getItem() {
      throw new Error('SecurityError');
    },
    setItem() {
      throw new Error('QuotaExceededError');
    },
  };
  const game = new SnakeGame({ headless: true, storage: brokenStorage });
  assert.equal(game.bestScore, 0);
  game.startGame();
  game.apple = { x: game.snake[0].x + 1, y: game.snake[0].y };
  assert.doesNotThrow(() => game.step());
  assert.equal(game.score, 10);
  assert.equal(game.bestScore, 10);
});
