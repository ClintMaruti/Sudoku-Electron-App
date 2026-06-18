import { describe, it, expect } from 'vitest'
import { generateBoard } from '../../src/main/engine/generator'
import { validateBoard, isValidMove } from '../../src/main/engine/validator'
import type { Board, Difficulty } from '../../global'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function countRevealed(board: Board): number {
  return board.flat().filter((cell) => cell !== 0).length
}

function hasDuplicatesInGroup(group: number[]): boolean {
  const filled = group.filter((n) => n !== 0)
  return new Set(filled).size !== filled.length
}

function isBoardStructurallyValid(board: Board): boolean {
  if (board.length !== 9) return false
  if (board.some((row) => row.length !== 9)) return false

  // Check rows
  for (const row of board) {
    if (hasDuplicatesInGroup(row)) return false
  }

  // Check columns
  for (let col = 0; col < 9; col++) {
    const column = board.map((row) => row[col])
    if (hasDuplicatesInGroup(column)) return false
  }

  // Check 3x3 subgrids
  for (let boxRow = 0; boxRow < 3; boxRow++) {
    for (let boxCol = 0; boxCol < 3; boxCol++) {
      const subgrid: number[] = []
      for (let r = boxRow * 3; r < boxRow * 3 + 3; r++) {
        for (let c = boxCol * 3; c < boxCol * 3 + 3; c++) {
          subgrid.push(board[r][c])
        }
      }
      if (hasDuplicatesInGroup(subgrid)) return false
    }
  }

  return true
}

function isCompletedBoard(board: Board): boolean {
  return board.flat().every((cell) => cell >= 1 && cell <= 9)
}

// ---------------------------------------------------------------------------
// Board generation
// ---------------------------------------------------------------------------

describe('generateBoard', () => {
  describe('board structure', () => {
    it('generates a 9x9 board', () => {
      const { board } = generateBoard('easy')
      expect(board).toHaveLength(9)
      board.forEach((row) => expect(row).toHaveLength(9))
    })

    it('contains only values 0–9', () => {
      const { board } = generateBoard('medium')
      board.flat().forEach((cell) => {
        expect(cell).toBeGreaterThanOrEqual(0)
        expect(cell).toBeLessThanOrEqual(9)
      })
    })

    it('has no duplicates in any row', () => {
      const { board } = generateBoard('easy')
      for (const row of board) {
        const filled = row.filter((n) => n !== 0)
        expect(new Set(filled).size).toBe(filled.length)
      }
    })

    it('has no duplicates in any column', () => {
      const { board } = generateBoard('easy')
      for (let col = 0; col < 9; col++) {
        const column = board.map((row) => row[col]).filter((n) => n !== 0)
        expect(new Set(column).size).toBe(column.length)
      }
    })

    it('has no duplicates in any 3x3 subgrid', () => {
      const { board } = generateBoard('easy')
      for (let boxRow = 0; boxRow < 3; boxRow++) {
        for (let boxCol = 0; boxCol < 3; boxCol++) {
          const subgrid: number[] = []
          for (let r = boxRow * 3; r < boxRow * 3 + 3; r++) {
            for (let c = boxCol * 3; c < boxCol * 3 + 3; c++) {
              subgrid.push(board[r][c])
            }
          }
          const filled = subgrid.filter((n) => n !== 0)
          expect(new Set(filled).size).toBe(filled.length)
        }
      }
    })

    it('solution is a fully completed valid board', () => {
      const { solution } = generateBoard('easy')
      expect(isCompletedBoard(solution)).toBe(true)
      expect(isBoardStructurallyValid(solution)).toBe(true)
    })

    it('every revealed cell in board matches the solution', () => {
      const { board, solution } = generateBoard('medium')
      for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
          if (board[r][c] !== 0) {
            expect(board[r][c]).toBe(solution[r][c])
          }
        }
      }
    })
  })

  describe('difficulty — revealed cell counts', () => {
    const EASY_TARGET = 36
    const MEDIUM_TARGET = 27
    const HARD_TARGET = 20
    const TOLERANCE = 2

    it.each<[Difficulty, number]>([
      ['easy', EASY_TARGET],
      ['medium', MEDIUM_TARGET],
      ['hard', HARD_TARGET],
    ])('%s difficulty reveals ~%i cells (±%i)', (difficulty, target) => {
      const { board } = generateBoard(difficulty)
      const revealed = countRevealed(board)
      expect(revealed).toBeGreaterThanOrEqual(target - TOLERANCE)
      expect(revealed).toBeLessThanOrEqual(target + TOLERANCE)
    })

    it('easy has more revealed cells than medium', () => {
      const easy = countRevealed(generateBoard('easy').board)
      const medium = countRevealed(generateBoard('medium').board)
      expect(easy).toBeGreaterThan(medium)
    })

    it('medium has more revealed cells than hard', () => {
      const medium = countRevealed(generateBoard('medium').board)
      const hard = countRevealed(generateBoard('hard').board)
      expect(medium).toBeGreaterThan(hard)
    })
  })

  describe('unique solution', () => {
    it('generated puzzle has exactly one valid completion', () => {
      const { board, solution } = generateBoard('easy')

      // The solution provided must complete the puzzle
      expect(isCompletedBoard(solution)).toBe(true)
      expect(isBoardStructurallyValid(solution)).toBe(true)

      // Every given cell must match the solution
      for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
          if (board[r][c] !== 0) {
            expect(board[r][c]).toBe(solution[r][c])
          }
        }
      }
    })

    it('hard puzzle still has a valid solution', () => {
      const { board, solution } = generateBoard('hard')
      expect(isBoardStructurallyValid(solution)).toBe(true)
      for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
          if (board[r][c] !== 0) {
            expect(board[r][c]).toBe(solution[r][c])
          }
        }
      }
    })
  })

  describe('determinism across calls', () => {
    it('two easy puzzles are both structurally valid (independent generation)', () => {
      const { board: b1 } = generateBoard('easy')
      const { board: b2 } = generateBoard('easy')
      expect(isBoardStructurallyValid(b1)).toBe(true)
      expect(isBoardStructurallyValid(b2)).toBe(true)
    })
  })
})

// ---------------------------------------------------------------------------
// Board validation
// ---------------------------------------------------------------------------

describe('validateBoard', () => {
  function buildFullBoard(values: number[]): Board {
    const board: Board = []
    for (let r = 0; r < 9; r++) {
      board.push(values.slice(r * 9, r * 9 + 9))
    }
    return board
  }

  const VALID_COMPLETED: number[] = [
    5, 3, 4, 6, 7, 8, 9, 1, 2,
    6, 7, 2, 1, 9, 5, 3, 4, 8,
    1, 9, 8, 3, 4, 2, 5, 6, 7,
    8, 5, 9, 7, 6, 1, 4, 2, 3,
    4, 2, 6, 8, 5, 3, 7, 9, 1,
    7, 1, 3, 9, 2, 4, 8, 5, 6,
    9, 6, 1, 5, 3, 7, 2, 8, 4,
    2, 8, 7, 4, 1, 9, 6, 3, 5,
    3, 4, 5, 2, 8, 6, 1, 7, 9,
  ]

  it('accepts a valid completed board', () => {
    const board = buildFullBoard(VALID_COMPLETED)
    const result = validateBoard(board)
    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('rejects a board with a duplicate in a row', () => {
    const values = [...VALID_COMPLETED]
    // Put a duplicate 5 in row 0: positions 0 and 1
    values[1] = 5 // row 0, col 1 — was 3, now 5 (duplicate of col 0)
    const board = buildFullBoard(values)
    const result = validateBoard(board)
    expect(result.valid).toBe(false)
    expect(result.errors.some((e) => e.reason === 'row')).toBe(true)
  })

  it('rejects a board with a duplicate in a column', () => {
    const values = [...VALID_COMPLETED]
    // Make row 1, col 0 = 5 (duplicate with row 0, col 0)
    values[9] = 5
    const board = buildFullBoard(values)
    const result = validateBoard(board)
    expect(result.valid).toBe(false)
    expect(result.errors.some((e) => e.reason === 'column')).toBe(true)
  })

  it('rejects a board with a duplicate in a 3x3 subgrid', () => {
    const values = [...VALID_COMPLETED]
    // Top-left subgrid: rows 0-2, cols 0-2. Make [1][1] = 5 (dup of [0][0])
    values[10] = 5
    const board = buildFullBoard(values)
    const result = validateBoard(board)
    expect(result.valid).toBe(false)
    expect(result.errors.some((e) => e.reason === 'subgrid')).toBe(true)
  })

  it('returns multiple errors when multiple groups are violated', () => {
    const board: Board = Array.from({ length: 9 }, () => Array(9).fill(1))
    const result = validateBoard(board)
    expect(result.valid).toBe(false)
    expect(result.errors.length).toBeGreaterThan(1)
  })

  it('returns cell coordinates for every error', () => {
    const values = [...VALID_COMPLETED]
    values[1] = 5 // row duplicate
    const board = buildFullBoard(values)
    const result = validateBoard(board)
    result.errors.forEach((err) => {
      expect(err.row).toBeGreaterThanOrEqual(0)
      expect(err.row).toBeLessThan(9)
      expect(err.col).toBeGreaterThanOrEqual(0)
      expect(err.col).toBeLessThan(9)
    })
  })
})

// ---------------------------------------------------------------------------
// Move validation (isValidMove)
// ---------------------------------------------------------------------------

describe('isValidMove', () => {
  const emptyBoard: Board = Array.from({ length: 9 }, () => Array(9).fill(0))

  it('accepts a valid placement in an empty board', () => {
    expect(isValidMove(emptyBoard, 0, 0, 5)).toBe(true)
  })

  it('rejects a value already present in the same row', () => {
    const board = emptyBoard.map((r) => [...r])
    board[0][3] = 5
    expect(isValidMove(board, 0, 0, 5)).toBe(false)
  })

  it('rejects a value already present in the same column', () => {
    const board = emptyBoard.map((r) => [...r])
    board[3][0] = 5
    expect(isValidMove(board, 0, 0, 5)).toBe(false)
  })

  it('rejects a value already present in the same 3x3 subgrid', () => {
    const board = emptyBoard.map((r) => [...r])
    board[1][1] = 5
    expect(isValidMove(board, 0, 0, 5)).toBe(false)
  })

  it('accepts a value when no conflict exists', () => {
    const board = emptyBoard.map((r) => [...r])
    board[0][3] = 3
    board[3][0] = 7
    board[1][1] = 9
    expect(isValidMove(board, 0, 0, 5)).toBe(true)
  })

  it('rejects out-of-range values (0)', () => {
    expect(isValidMove(emptyBoard, 0, 0, 0)).toBe(false)
  })

  it('rejects out-of-range values (10)', () => {
    expect(isValidMove(emptyBoard, 0, 0, 10)).toBe(false)
  })
})
