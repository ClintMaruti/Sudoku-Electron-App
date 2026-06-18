import { generateBoard } from '../engine/generator'
import { validateBoard } from '../engine/validator'
import type { Board, Difficulty, GameState, NewGameResponse, ValidationResponse } from '../../../global'

// ---------------------------------------------------------------------------
// Persistence (lazy-loaded to avoid Electron import issues in tests)
// ---------------------------------------------------------------------------

let _store: { get(key: string): unknown; set(key: string, val: unknown): void } | null = null

async function getStore() {
  if (!_store) {
    const Store = (await import('electron-store')).default
    const options: { name?: string; cwd?: string } = {}
    if (process.env.NODE_ENV === 'test') {
      options.name = 'sudoku-test'
      if (process.env.E2E_STORE_PATH) {
        options.cwd = process.env.E2E_STORE_PATH
      }
    }
    _store = new Store(options)
  }
  return _store
}

const SAVE_KEY = 'gameState'

let activeGame: NewGameResponse | null = null

// ---------------------------------------------------------------------------
// IPC handlers — pure functions that can be called from tests without Electron
// ---------------------------------------------------------------------------

export async function handleGameNew(difficulty: Difficulty): Promise<NewGameResponse> {
  const valid: Difficulty[] = ['easy', 'medium', 'hard']
  if (!valid.includes(difficulty)) {
    throw new Error(`Invalid difficulty: ${difficulty}`)
  }
  const result = generateBoard(difficulty)
  activeGame = result
  return result
}

/** Dev/test helper — returns the solution for the most recently generated game. */
export async function handleGameDevGetSolution(): Promise<Board | null> {
  return activeGame?.solution ?? null
}

export async function handleGameValidate(board: Board): Promise<ValidationResponse> {
  return validateBoard(board)
}

export async function handleGameSave(state: GameState): Promise<void> {
  const store = await getStore()
  store.set(SAVE_KEY, state)
}

export async function handleGameLoad(): Promise<GameState | null> {
  const store = await getStore()
  const saved = store.get(SAVE_KEY)
  if (!saved) return null
  return saved as GameState
}
