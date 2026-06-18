import type { Board, Difficulty, NewGameResponse } from '../../../global'

/**
 * Generates a valid Sudoku puzzle with a unique solution.
 *
 * Difficulty controls revealed cell count:
 *   easy   → ~36 revealed
 *   medium → ~27 revealed
 *   hard   → ~20 revealed
 *
 * Returns both the puzzle (board) and the full solution.
 */
export function generateBoard(difficulty: Difficulty): NewGameResponse {
  const solution = buildSolvedBoard()
  const board = removeClues(solution, difficulty)
  return { board, solution, difficulty }
}

function buildSolvedBoard(): Board {
  const board: Board = Array.from({ length: 9 }, () => Array(9).fill(0))
  solve(board)
  return board
}

function solve(board: Board): boolean {
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (board[row][col] === 0) {
        const nums = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9])
        for (const num of nums) {
          if (canPlace(board, row, col, num)) {
            board[row][col] = num
            if (solve(board)) return true
            board[row][col] = 0
          }
        }
        return false
      }
    }
  }
  return true
}

function canPlace(board: Board, row: number, col: number, num: number): boolean {
  if (board[row].includes(num)) return false
  if (board.some((r) => r[col] === num)) return false
  const br = Math.floor(row / 3) * 3
  const bc = Math.floor(col / 3) * 3
  for (let r = br; r < br + 3; r++) {
    for (let c = bc; c < bc + 3; c++) {
      if (board[r][c] === num) return false
    }
  }
  return true
}

function removeClues(solution: Board, difficulty: Difficulty): Board {
  const targetRevealed = difficulty === 'easy' ? 36 : difficulty === 'medium' ? 27 : 20
  const board = solution.map((row) => [...row])
  const cells = shuffle(
    Array.from({ length: 81 }, (_, i) => i)
  )
  let removed = 0
  const toRemove = 81 - targetRevealed

  for (const idx of cells) {
    if (removed >= toRemove) break
    const row = Math.floor(idx / 9)
    const col = idx % 9
    board[row][col] = 0
    removed++
  }
  return board
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}
