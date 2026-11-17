import fs from 'node:fs';
import path from 'node:path';

export type DifficultyMode = 'casual' | 'normal' | 'hard';

export interface LeaderboardEntry {
  id: string;
  playerName: string;
  score: number;
  difficulty: DifficultyMode;
  apples: number;
  createdAt: string;
}

export interface SubmitScoreInput {
  playerName?: unknown;
  score?: unknown;
  difficulty?: unknown;
  apples?: unknown;
}

export const VALID_DIFFICULTIES: readonly DifficultyMode[] = ['casual', 'normal', 'hard'];
export const MAX_LEADERBOARD_ENTRIES = 100;

const DEFAULT_SEED_ENTRIES: LeaderboardEntry[] = [
  {
    id: 'seed-1',
    playerName: 'Ada',
    score: 95,
    difficulty: 'hard',
    apples: 7,
    createdAt: '2026-11-16T10:00:00.000Z',
  },
  {
    id: 'seed-2',
    playerName: 'Lin',
    score: 70,
    difficulty: 'normal',
    apples: 7,
    createdAt: '2026-11-16T11:30:00.000Z',
  },
  {
    id: 'seed-3',
    playerName: 'Sam',
    score: 50,
    difficulty: 'casual',
    apples: 5,
    createdAt: '2026-11-16T12:15:00.000Z',
  },
];

export function isValidDifficulty(value: unknown): value is DifficultyMode {
  return value === 'casual' || value === 'normal' || value === 'hard';
}

export function sanitizePlayerName(raw: unknown): string {
  if (typeof raw !== 'string') return '';
  return raw.replace(/[\r\n\t]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 20);
}

export function sortLeaderboardEntries(entries: LeaderboardEntry[]): LeaderboardEntry[] {
  return [...entries].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (b.apples !== a.apples) return b.apples - a.apples;
    return a.createdAt.localeCompare(b.createdAt);
  });
}

export function validateScoreSubmission(
  input: SubmitScoreInput
): { ok: true; value: Omit<LeaderboardEntry, 'id' | 'createdAt'> } | { ok: false; error: string } {
  const playerName = sanitizePlayerName(input.playerName);
  if (playerName.length < 1) {
    return { ok: false, error: 'Please enter a player name (1–20 characters).' };
  }

  const score = typeof input.score === 'number' ? input.score : Number(input.score);
  if (!Number.isInteger(score) || score < 1 || score > 50000) {
    return { ok: false, error: 'Score must be an integer between 1 and 50000.' };
  }

  if (!isValidDifficulty(input.difficulty)) {
    return { ok: false, error: 'Difficulty must be casual, normal, or hard.' };
  }

  const rawApples = input.apples === undefined ? 0 : Number(input.apples);
  const apples = Number.isInteger(rawApples) && rawApples >= 0 && rawApples <= 400 ? rawApples : 0;

  return {
    ok: true,
    value: {
      playerName,
      score,
      difficulty: input.difficulty,
      apples,
    },
  };
}

export class LeaderboardStore {
  private readonly filePath: string;
  private entries: LeaderboardEntry[] = [];

  constructor(filePath: string) {
    this.filePath = filePath;
    this.load();
  }

  private load(): void {
    try {
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf8');
        const parsed = JSON.parse(raw) as unknown;
        if (Array.isArray(parsed)) {
          this.entries = sortLeaderboardEntries(
            parsed.filter(
              (item): item is LeaderboardEntry =>
                Boolean(item) &&
                typeof item === 'object' &&
                typeof item.id === 'string' &&
                typeof item.playerName === 'string' &&
                typeof item.score === 'number' &&
                isValidDifficulty(item.difficulty) &&
                typeof item.createdAt === 'string'
            )
          ).slice(0, MAX_LEADERBOARD_ENTRIES);
          return;
        }
      }
    } catch {
      // Fall back to default seed entries if file is unreadable
    }

    this.entries = sortLeaderboardEntries(DEFAULT_SEED_ENTRIES);
    this.save();
  }

  private save(): void {
    try {
      const dir = path.dirname(this.filePath);
      fs.mkdirSync(dir, { recursive: true });
      const tmpPath = `${this.filePath}.tmp`;
      fs.writeFileSync(tmpPath, JSON.stringify(this.entries, null, 2), 'utf8');
      fs.renameSync(tmpPath, this.filePath);
    } catch {
      // Keep in-memory entries if filesystem write fails
    }
  }

  list(difficulty: DifficultyMode | 'all' = 'all', limit = 20): LeaderboardEntry[] {
    const safeLimit = Math.max(1, Math.min(100, limit));
    const filtered =
      difficulty === 'all'
        ? this.entries
        : this.entries.filter((entry) => entry.difficulty === difficulty);
    return filtered.slice(0, safeLimit);
  }

  add(input: SubmitScoreInput):
    | { ok: true; entry: LeaderboardEntry; rank: number; entries: LeaderboardEntry[] }
    | { ok: false; error: string } {
    const validated = validateScoreSubmission(input);
    if (!validated.ok) {
      return validated;
    }

    const entry: LeaderboardEntry = {
      id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
      playerName: validated.value.playerName,
      score: validated.value.score,
      difficulty: validated.value.difficulty,
      apples: validated.value.apples,
      createdAt: new Date().toISOString(),
    };

    this.entries = sortLeaderboardEntries([...this.entries, entry]).slice(
      0,
      MAX_LEADERBOARD_ENTRIES
    );
    this.save();

    const modeEntries = this.list(entry.difficulty, MAX_LEADERBOARD_ENTRIES);
    const rankIndex = modeEntries.findIndex((item) => item.id === entry.id);

    return {
      ok: true,
      entry,
      rank: rankIndex >= 0 ? rankIndex + 1 : modeEntries.length + 1,
      entries: this.list(entry.difficulty, 20),
    };
  }
}
