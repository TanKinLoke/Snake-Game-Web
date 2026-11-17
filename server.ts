import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer as createViteServer } from 'vite';
import { isValidDifficulty, LeaderboardStore } from './leaderboardStore.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const isProduction = process.env.NODE_ENV === 'production';
const dataFilePath = path.resolve(__dirname, '.data', 'leaderboard.json');

const store = new LeaderboardStore(dataFilePath);

async function startServer(): Promise<void> {
  const app = express();
  app.use(express.json({ limit: '16kb' }));

  app.get('/api/leaderboard', (req, res) => {
    const rawDifficulty = typeof req.query.difficulty === 'string' ? req.query.difficulty : 'all';
    const difficulty =
      rawDifficulty === 'all' || isValidDifficulty(rawDifficulty) ? rawDifficulty : 'all';
    const rawLimit = typeof req.query.limit === 'string' ? Number.parseInt(req.query.limit, 10) : 20;
    const limit = Number.isFinite(rawLimit) ? rawLimit : 20;

    res.json({
      difficulty,
      entries: store.list(difficulty, limit),
    });
  });

  app.post('/api/leaderboard', (req, res) => {
    const result = store.add(req.body ?? {});
    if (!result.ok) {
      res.status(400).json({ error: result.error });
      return;
    }
    res.status(201).json({
      entry: result.entry,
      rank: result.rank,
      entries: result.entries,
    });
  });

  if (isProduction) {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Orchard Snake server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
