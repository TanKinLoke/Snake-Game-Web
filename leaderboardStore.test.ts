import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  LeaderboardStore,
  sanitizePlayerName,
  validateScoreSubmission,
} from './leaderboardStore.ts';

test('sanitizePlayerName normalizes whitespace and enforces 20-char limit', () => {
  assert.equal(sanitizePlayerName('  Ada\t\nLovelace  '), 'Ada Lovelace');
  assert.equal(sanitizePlayerName('1234567890123456789012345'), '12345678901234567890');
  assert.equal(sanitizePlayerName(null), '');
});

test('validateScoreSubmission validates player name, integer score, and difficulty', () => {
  assert.equal(
    validateScoreSubmission({ playerName: '   ', score: 20, difficulty: 'normal' }).ok,
    false
  );
  assert.equal(
    validateScoreSubmission({ playerName: 'Sam', score: 0, difficulty: 'normal' }).ok,
    false
  );
  assert.equal(
    validateScoreSubmission({ playerName: 'Sam', score: 15.5, difficulty: 'normal' }).ok,
    false
  );
  assert.equal(
    validateScoreSubmission({ playerName: 'Sam', score: 30, difficulty: 'impossible' }).ok,
    false
  );

  const valid = validateScoreSubmission({
    playerName: '  Alex  ',
    score: 125,
    difficulty: 'hard',
    apples: 10,
  });
  assert.equal(valid.ok, true);
  if (valid.ok) {
    assert.deepEqual(valid.value, {
      playerName: 'Alex',
      score: 125,
      difficulty: 'hard',
      apples: 10,
    });
  }
});

test('LeaderboardStore seeds defaults, ranks per difficulty, filters, and persists to disk', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'orchard-snake-lb-'));
  const filePath = path.join(tmpDir, 'leaderboard.json');

  try {
    const store = new LeaderboardStore(filePath);
    const initialAll = store.list('all', 20);
    assert.equal(initialAll.length, 3);
    assert.equal(initialAll[0].score, 95);

    const addHard = store.add({
      playerName: 'Zoe',
      score: 140,
      difficulty: 'hard',
      apples: 11,
    });
    assert.equal(addHard.ok, true);
    if (addHard.ok) {
      assert.equal(addHard.rank, 1);
      assert.equal(addHard.entry.playerName, 'Zoe');
    }

    const addNormal = store.add({
      playerName: 'Kai',
      score: 70,
      difficulty: 'normal',
      apples: 8,
    });
    assert.equal(addNormal.ok, true);
    if (addNormal.ok) {
      // Tie-breaker: higher apple count (8 > 7) ranks #1 in normal
      assert.equal(addNormal.rank, 1);
    }

    // Reload from disk and verify persistence and filtering
    const reloaded = new LeaderboardStore(filePath);
    const hardOnly = reloaded.list('hard', 20);
    assert.equal(hardOnly.length, 2);
    assert.equal(hardOnly[0].playerName, 'Zoe');
    assert.equal(hardOnly[1].playerName, 'Ada');

    const normalOnly = reloaded.list('normal', 20);
    assert.equal(normalOnly[0].playerName, 'Kai');
    assert.equal(normalOnly[1].playerName, 'Lin');
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});
