# Sudoku Electron App

A fully playable cross-platform Sudoku desktop application built with Electron, React, and TypeScript.

## Prerequisites

- Node.js 20+
- npm 10+

## Setup

```bash
npm install
```

## Development

```bash
npm run dev
```

Starts the app in development mode with hot reload (Vite for renderer, tsc for main process).

## Build

```bash
npm run build
```

Compiles both the renderer (Vite → dist/) and main process (tsc → out/main/).

## Test

```bash
npm run test
```

Runs all Vitest unit tests.

```bash
npm run test:e2e
```

Runs all Playwright end-to-end tests (requires the app to be buildable).

## Package

```bash
npm run package
```

Builds distributables for the current OS:
- macOS: `.dmg` (x64 + arm64 universal binary)
- Windows: `.exe` NSIS installer (x64)

Output is placed in `release/`.

## Project Structure

```
src/
  main/
    main.ts           # Electron main process entry point
    engine/           # Puzzle engine (no Electron deps — pure logic)
      generator.ts    # Backtracking board generator
      validator.ts    # Board and move validation
    ipc/
      handlers.ts     # IPC handler implementations
  preload/
    preload.ts        # contextBridge API exposure
  renderer/
    ...               # React + TypeScript UI
tests/
  unit/               # Vitest unit tests (engine, IPC handlers, undo)
  e2e/                # Playwright + Electron E2E tests
```

## Commit Convention

All commits follow [Conventional Commits](https://www.conventionalcommits.org/):
`feat:`, `fix:`, `chore:`, `test:`, `docs:`
