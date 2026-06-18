import type { Board, Move } from '../../../global'

/**
 * Applies a move to the board and returns a new board (does not mutate).
 */
export function applyMove(board: Board, move: Move): Board {
  const next = board.map((row) => [...row])
  next[move.row][move.col] = move.newValue
  return next
}

/**
 * Reverts a move by restoring the cell to its previousValue.
 * Returns a new board (does not mutate).
 */
export function undoMove(board: Board, move: Move): Board {
  const next = board.map((row) => [...row])
  next[move.row][move.col] = move.previousValue
  return next
}
