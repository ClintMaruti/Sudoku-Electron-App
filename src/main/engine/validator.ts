import type { Board, ValidationResponse, CellError } from '../../../global'

/**
 * Validates a completed (or partial) Sudoku board.
 * Returns { valid, errors } where errors lists every conflicting cell with a reason.
 */
export function validateBoard(board: Board): ValidationResponse {
  const errors: CellError[] = []

  // Check rows
  for (let row = 0; row < 9; row++) {
    const seen = new Map<number, number>()
    for (let col = 0; col < 9; col++) {
      const val = board[row][col]
      if (val === 0) continue
      if (seen.has(val)) {
        errors.push({ row, col: seen.get(val)!, reason: 'row' })
        errors.push({ row, col, reason: 'row' })
      } else {
        seen.set(val, col)
      }
    }
  }

  // Check columns
  for (let col = 0; col < 9; col++) {
    const seen = new Map<number, number>()
    for (let row = 0; row < 9; row++) {
      const val = board[row][col]
      if (val === 0) continue
      if (seen.has(val)) {
        errors.push({ row: seen.get(val)!, col, reason: 'column' })
        errors.push({ row, col, reason: 'column' })
      } else {
        seen.set(val, row)
      }
    }
  }

  // Check 3x3 subgrids
  for (let boxRow = 0; boxRow < 3; boxRow++) {
    for (let boxCol = 0; boxCol < 3; boxCol++) {
      const seen = new Map<number, [number, number]>()
      for (let r = boxRow * 3; r < boxRow * 3 + 3; r++) {
        for (let c = boxCol * 3; c < boxCol * 3 + 3; c++) {
          const val = board[r][c]
          if (val === 0) continue
          if (seen.has(val)) {
            const [pr, pc] = seen.get(val)!
            errors.push({ row: pr, col: pc, reason: 'subgrid' })
            errors.push({ row: r, col: c, reason: 'subgrid' })
          } else {
            seen.set(val, [r, c])
          }
        }
      }
    }
  }

  return { valid: errors.length === 0, errors }
}

/**
 * Returns true if placing `value` at (row, col) does not conflict with
 * existing cells in the board's row, column, or 3x3 subgrid.
 */
export function isValidMove(board: Board, row: number, col: number, value: number): boolean {
  if (value < 1 || value > 9) return false

  // Row check
  if (board[row].some((v, c) => c !== col && v === value)) return false

  // Column check
  if (board.some((r, ri) => ri !== row && r[col] === value)) return false

  // Subgrid check
  const br = Math.floor(row / 3) * 3
  const bc = Math.floor(col / 3) * 3
  for (let r = br; r < br + 3; r++) {
    for (let c = bc; c < bc + 3; c++) {
      if ((r !== row || c !== col) && board[r][c] === value) return false
    }
  }

  return true
}
