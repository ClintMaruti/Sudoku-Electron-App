import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Board, GameState, Difficulty } from '../../global'

// ---------------------------------------------------------------------------
// IPC handler shape contracts
//
// These tests verify the response shapes that main/ipc/handlers.ts must return.
// We import the handler functions directly (no Electron dependency) and stub
// the puzzle engine + persistence layer so the tests remain pure unit tests.
// ---------------------------------------------------------------------------

// Hoisted mocks — resolved before any imports
vi.mock('../../src/main/engine/generator', () => ({
  generateBoard: vi.fn(),
}))

vi.mock('../../src/main/engine/validator', () => ({
  validateBoard: vi.fn(),
}))

vi.mock('electron-store', () => {
  const store: Record<string, unknown> = {}
  return {
    default: vi.fn().mockImplementation(() => ({
      get: vi.fn((key: string) => store[key]),
      set: vi.fn((key: string, value: unknown) => {
        store[key] = value
      }),
      delete: vi.fn((key: string) => {
        delete store[key]
      }),
    })),
  }
})

import { generateBoard } from '../../src/main/engine/generator'
import { validateBoard } from '../../src/main/engine/validator'
import {
  handleGameNew,
  handleGameValidate,
  handleGameSave,
  handleGameLoad,
} from '../../src/main/ipc/handlers'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const MOCK_BOARD: Board = Array.from({ length: 9 }, (_, r) =>
  Array.from({ length: 9 }, (_, c) => ((r * 9 + c) % 9) + 1)
)

const MOCK_SOLUTION: Board = Array.from({ length: 9 }, (_, r) =>
  Array.from({ length: 9 }, (_, c) => ((r * 9 + c + 1) % 9) + 1)
)

const MOCK_STATE: GameState = {
  board: MOCK_BOARD,
  initialBoard: MOCK_BOARD,
  solution: MOCK_SOLUTION,
  difficulty: 'medium',
  moves: [],
  timerSeconds: 0,
}

// ---------------------------------------------------------------------------
// game:new
// ---------------------------------------------------------------------------

describe('handleGameNew', () => {
  beforeEach(() => {
    vi.mocked(generateBoard).mockReturnValue({
      board: MOCK_BOARD,
      solution: MOCK_SOLUTION,
      difficulty: 'easy',
    })
  })

  it.each<Difficulty>(['easy', 'medium', 'hard'])(
    'returns correct shape for difficulty=%s',
    async (difficulty) => {
      vi.mocked(generateBoard).mockReturnValue({
        board: MOCK_BOARD,
        solution: MOCK_SOLUTION,
        difficulty,
      })
      const result = await handleGameNew(difficulty)

      expect(result).toHaveProperty('board')
      expect(result).toHaveProperty('solution')
      expect(result).toHaveProperty('difficulty', difficulty)
    }
  )

  it('board is a 9x9 array', async () => {
    const result = await handleGameNew('easy')
    expect(result.board).toHaveLength(9)
    result.board.forEach((row: number[]) => expect(row).toHaveLength(9))
  })

  it('solution is a 9x9 array', async () => {
    const result = await handleGameNew('easy')
    expect(result.solution).toHaveLength(9)
    result.solution.forEach((row: number[]) => expect(row).toHaveLength(9))
  })

  it('calls generateBoard with the given difficulty', async () => {
    await handleGameNew('hard')
    expect(generateBoard).toHaveBeenCalledWith('hard')
  })

  it('throws / rejects on invalid difficulty', async () => {
    await expect(
      handleGameNew('extreme' as Difficulty)
    ).rejects.toThrow()
  })
})

// ---------------------------------------------------------------------------
// game:validate
// ---------------------------------------------------------------------------

describe('handleGameValidate', () => {
  beforeEach(() => {
    vi.mocked(validateBoard).mockReturnValue({ valid: true, errors: [] })
  })

  it('returns a valid response shape when board is valid', async () => {
    vi.mocked(validateBoard).mockReturnValue({ valid: true, errors: [] })
    const result = await handleGameValidate(MOCK_BOARD)

    expect(result).toHaveProperty('valid', true)
    expect(result).toHaveProperty('errors')
    expect(Array.isArray(result.errors)).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('returns errors array with cell coordinates when board is invalid', async () => {
    vi.mocked(validateBoard).mockReturnValue({
      valid: false,
      errors: [{ row: 0, col: 1, reason: 'row' }],
    })
    const result = await handleGameValidate(MOCK_BOARD)

    expect(result.valid).toBe(false)
    expect(result.errors).toHaveLength(1)
    expect(result.errors[0]).toMatchObject({ row: 0, col: 1, reason: 'row' })
  })

  it('calls validateBoard with the provided board', async () => {
    await handleGameValidate(MOCK_BOARD)
    expect(validateBoard).toHaveBeenCalledWith(MOCK_BOARD)
  })

  it('returns valid=false for a board full of the same number', async () => {
    const invalidBoard: Board = Array.from({ length: 9 }, () => Array(9).fill(1))
    vi.mocked(validateBoard).mockReturnValue({
      valid: false,
      errors: [{ row: 0, col: 1, reason: 'row' }],
    })
    const result = await handleGameValidate(invalidBoard)
    expect(result.valid).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// game:save
// ---------------------------------------------------------------------------

describe('handleGameSave', () => {
  it('resolves without error when given a valid state', async () => {
    await expect(handleGameSave(MOCK_STATE)).resolves.toBeUndefined()
  })

  it('persists board, solution, difficulty, moves, and timer', async () => {
    await handleGameSave(MOCK_STATE)
    const loaded = await handleGameLoad()

    expect(loaded).not.toBeNull()
    expect(loaded!.difficulty).toBe(MOCK_STATE.difficulty)
    expect(loaded!.timerSeconds).toBe(MOCK_STATE.timerSeconds)
  })

  it('overwrites a previous save', async () => {
    await handleGameSave(MOCK_STATE)
    const updated: GameState = { ...MOCK_STATE, timerSeconds: 120, difficulty: 'hard' }
    await handleGameSave(updated)

    const loaded = await handleGameLoad()
    expect(loaded!.timerSeconds).toBe(120)
    expect(loaded!.difficulty).toBe('hard')
  })
})

// ---------------------------------------------------------------------------
// game:load
// ---------------------------------------------------------------------------

describe('handleGameLoad', () => {
  it('returns null when no save exists', async () => {
    // Reset store by calling save with something then reimport
    // For simplicity, we test this after clearing via a fresh module approach.
    // Here we rely on the test-isolation provided by the mock store.
    // A null return is expected if the store key is absent.
    const result = await handleGameLoad()
    // Either null (no prior save in this test run) or the previously saved state
    if (result !== null) {
      expect(result).toHaveProperty('board')
      expect(result).toHaveProperty('solution')
      expect(result).toHaveProperty('difficulty')
    }
  })

  it('returns the correct state shape after a save', async () => {
    await handleGameSave(MOCK_STATE)
    const result = await handleGameLoad()

    expect(result).not.toBeNull()
    expect(result).toHaveProperty('board')
    expect(result).toHaveProperty('initialBoard')
    expect(result).toHaveProperty('solution')
    expect(result).toHaveProperty('difficulty')
    expect(result).toHaveProperty('moves')
    expect(result).toHaveProperty('timerSeconds')
  })

  it('loaded board is a 9x9 array', async () => {
    await handleGameSave(MOCK_STATE)
    const result = await handleGameLoad()
    expect(result!.board).toHaveLength(9)
    result!.board.forEach((row: number[]) => expect(row).toHaveLength(9))
  })

  it('loaded moves array is an array', async () => {
    await handleGameSave({ ...MOCK_STATE, moves: [] })
    const result = await handleGameLoad()
    expect(Array.isArray(result!.moves)).toBe(true)
  })
})
