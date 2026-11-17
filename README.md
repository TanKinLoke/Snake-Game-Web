# Orchard Snake

A responsive, zero-dependency HTML5 Canvas Snake arcade game built with vanilla HTML5, CSS3, and ES6+ JavaScript.

## Features

- **Pure Vanilla Architecture**: Separated into `index.html`, `style.css`, and `game.js` with all game state, input buffering, audio, and rendering encapsulated in the `SnakeGame` class.
- **High-DPI Canvas & Inline SVG Sprites**: Preloads inline `data:image/svg+xml;utf8,...` apple, golden apple, and directional snake head sprites via `Promise.all`, scales the `20x20` checkerboard grid to fit the viewport, and renders crisply using `window.devicePixelRatio`.
- **Difficulty Modes & Per-Difficulty Best Scores**: Choose between **Casual** (`175ms` start, `-1ms`/apple, `95ms` cap), **Normal** (`140ms` start, `-2ms`/apple, `75ms` cap), and **Hard** (`105ms` start, `-3ms`/apple, `55ms` cap). Best scores are tracked independently per mode in `localStorage` (`snake_best_score_casual`, `snake_best_score_normal`, `snake_best_score_hard`) and displayed live in the HUD (`Best · <Mode>`).
- **Bonus Golden Apples**: Every 4th regular apple eaten spawns a timed Golden Apple (`+25` points, `6.5s` duration with a circular countdown ring on the canvas, golden chime arpeggio, and +1 segment growth).
- **Visual Juice & Accessibility Options**: Pooled zero-GC particle bursts on pickups and crashes, toggleable crash screen shake (respecting `prefers-reduced-motion`), and a toggleable **High Contrast** color-blind-safe palette (`#38bdf8` snake with `#ffffff` crisp outlines).
- **Responsive Controls & Synthesized Audio**: 2-turn directional queue, Arrow keys / `WASD`, `P` / `Space` / `Escape` to pause, `M` to mute, swipe gestures (`30px` threshold), mobile on-screen D-Pad (`pointerdown`), and Web Audio API retro sound effects.

## Controls

| Action | Desktop | Mobile |
| --- | --- | --- |
| Steer | Arrow Keys or `W` `A` `S` `D` | On-screen D-Pad or Swipe |
| Start / Play Again | `Enter` or `Space` | Tap Primary Button |
| Pause / Resume | `P`, `Space`, or `Escape` | Tap Pause Icon |
| Mute / Unmute | `M` | Tap Sound Icon |

## Project Files

- `index.html` — Semantic HUD bar, canvas container, Start/Pause/Game Over overlay modal, visual accessibility toggles, and mobile D-Pad.
- `style.css` — Responsive `100dvh` layout, moss-and-emerald + `body.high-contrast` themes, tabular numerals, and mobile breakpoints.
- `game.js` — `SnakeGame` ES6 class handling sprite preloading, Web Audio synthesis, input queue, golden apples, pooled particles, screen shake, per-difficulty scores, and canvas rendering.
- `game.test.mjs` — Deterministic Node unit tests (`node:test`) covering game mechanics, difficulty presets, per-difficulty best scores, golden apples, and accessibility toggles.

## Running Locally & Testing

Start the development server:

```bash
npm run dev
```

Run unit tests:

```bash
npx --yes tsx --test game.test.mjs
```

Build for production:

```bash
npm run build
```

## Deploying to GitHub Pages

This project is 100% client-side with relative asset paths (`./`) and works on GitHub Pages in two ways:

1. **GitHub Actions (Recommended)**: Push to `main` and in repository **Settings → Pages**, set **Source** to **GitHub Actions**. The included workflow builds `dist/` with relative `./assets/` paths so it works on both `username.github.io` and `username.github.io/repo-name/`.
2. **Deploy from Branch (`/(root)`)**: Because `index.html`, `style.css`, and `game.js` use pure vanilla ES modules and relative paths with zero build requirement, you can also set **Settings → Pages → Source** to **Deploy from a branch** (`main`, `/ (root)`).

