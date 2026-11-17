# Orchard Snake

A responsive HTML5 Canvas Snake arcade game built with vanilla HTML5, CSS3, and ES6+ JavaScript on the client, backed by a lightweight Express server leaderboard.

## Features

- **Pure Vanilla Frontend**: Separated into `index.html`, `style.css`, and `game.js` with all client game state, input buffering, audio, and rendering encapsulated in the `SnakeGame` class.
- **High-DPI Canvas & Inline SVG Sprites**: Preloads inline `data:image/svg+xml;utf8,...` apple, golden apple, and directional snake head sprites via `Promise.all`, scales the `20x20` checkerboard grid to fit the viewport, and renders crisply using `window.devicePixelRatio`.
- **Difficulty Modes & Per-Difficulty Best Scores**: Choose between **Casual** (`175ms` start, `-1ms`/apple, `95ms` cap), **Normal** (`140ms` start, `-2ms`/apple, `75ms` cap), and **Hard** (`105ms` start, `-3ms`/apple, `55ms` cap). Best scores are tracked independently per mode in `localStorage` (`snake_best_score_casual`, `snake_best_score_normal`, `snake_best_score_hard`) and shown live in the HUD (`Best · <Mode>`).
- **Bonus Golden Apples**: Every 4th regular apple eaten spawns a timed Golden Apple (`+25` points, `6.5s` duration with a circular countdown ring on the canvas, golden chime arpeggio, and +1 segment growth).
- **Visual Juice & Accessibility Options**: Pooled zero-GC particle bursts on pickups and crashes, toggleable crash screen shake (respecting `prefers-reduced-motion`), and a toggleable **High Contrast** color-blind-safe palette (`#38bdf8` snake with `#ffffff` crisp outlines).
- **Server Leaderboard**: Express backend (`server.ts` + `leaderboardStore.ts`) persisting top scores to `.data/leaderboard.json` with `/api/leaderboard` (`GET` and `POST`), an in-game Leaderboard modal (`All / Casual / Normal / Hard` filters), and an inline Game Over score submission form.
- **Responsive Controls & Synthesized Audio**: 2-turn directional queue, Arrow keys / `WASD`, `P` / `Space` / `Escape` to pause, `M` to mute, `L` for Leaderboard, swipe gestures (`30px` threshold), mobile on-screen D-Pad (`pointerdown`), and Web Audio API retro sound effects.

## Controls

| Action | Desktop | Mobile |
| --- | --- | --- |
| Steer | Arrow Keys or `W` `A` `S` `D` | On-screen D-Pad or Swipe |
| Start / Play Again | `Enter` or `Space` | Tap Primary Button |
| Pause / Resume | `P`, `Space`, or `Escape` | Tap Pause Icon |
| Mute / Unmute | `M` | Tap Sound Icon |
| Leaderboard | `L` (`Escape` closes) | Tap Trophy Icon |

## Project Files

- `index.html` — Semantic HUD bar, canvas container, Start/Pause/Game Over overlay modal, visual accessibility toggles, and Leaderboard modal.
- `style.css` — Responsive `100dvh` layout, moss-and-emerald + `body.high-contrast` themes, tabular numerals, leaderboard styling, and mobile breakpoints.
- `game.js` — `SnakeGame` ES6 class handling sprite preloading, Web Audio synthesis, input queue, golden apples, pooled particles, screen shake, per-difficulty scores, and leaderboard API integration.
- `server.ts` — Express server mounting `/api/leaderboard` routes alongside Vite middleware in development or static `dist/` assets in production.
- `leaderboardStore.ts` — Score validation, sanitization, tie-break sorting, filtering, and atomic JSON file persistence.
- `game.test.mjs` & `leaderboardStore.test.ts` — Deterministic Node unit tests (`node:test`) covering game mechanics, difficulty presets, golden apples, accessibility toggles, and server leaderboard persistence.

## Running Locally & Testing

Start the development server (Express + Vite middleware on port `3000`):

```bash
npm run dev
```

Run all unit tests:

```bash
npx --yes tsx --test game.test.mjs leaderboardStore.test.ts
```

Build and run in production mode:

```bash
npm run build
NODE_ENV=production npm start
```
