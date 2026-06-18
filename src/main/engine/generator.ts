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
  const targetRevealed = difficulty === 'easy' ? 36 : difficulty === 'medium' ? 27 : 20
  const tolerance = 2
  const minRevealed = targetRevealed - tolerance
  const maxRevealed = targetRevealed + tolerance

  for (let attempt = 0; attempt < 100; attempt++) {
    const solution = buildSolvedBoard()
    const board = removeClues(solution, minRevealed, maxRevealed)
    const revealed = countRevealed(board)
    if (revealed >= minRevealed && revealed <= maxRevealed) {
      return { board, solution, difficulty }
    }
  }

  throw new Error(`Failed to generate ${difficulty} puzzle within revealed-cell tolerance`)
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

function removeClues(solution: Board, minRevealed: number, maxRevealed: number): Board {
  const board = solution.map((row) => [...row])

  for (let pass = 0; pass < 12; pass++) {
    const before = countRevealed(board)
    if (before <= maxRevealed) break

    const cells = shuffle(Array.from({ length: 81 }, (_, i) => i))
    for (const idx of cells) {
      if (countRevealed(board) <= maxRevealed) break

      const row = Math.floor(idx / 9)
      const col = idx % 9
      if (board[row][col] === 0) continue

      const backup = board[row][col]
      board[row][col] = 0
      if (!hasUniqueSolution(board)) {
        board[row][col] = backup
      }
    }

    if (countRevealed(board) === before) break
  }

  restoreCluesToMinimum(board, solution, minRevealed)
  return board
}

function restoreCluesToMinimum(board: Board, solution: Board, minRevealed: number): void {
  while (countRevealed(board) < minRevealed) {
    const hidden: [number, number][] = []
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (board[row][col] === 0) hidden.push([row, col])
      }
    }
    if (hidden.length === 0) break

    const [row, col] = shuffle(hidden)[0]
    board[row][col] = solution[row][col]
  }
}

function hasUniqueSolution(board: Board): boolean {
  const copy = board.map((row) => [...row])
  return countSolutions(copy, 2) === 1
}

function countRevealed(board: Board): number {
  return board.flat().filter((cell) => cell !== 0).length
}

/** Count valid completions; stops early once `limit` is reached. */
function countSolutions(board: Board, limit = 2): number {
  const empty = findEmptyCell(board)
  if (!empty) return 1

  const [row, col] = empty
  let count = 0
  for (let num = 1; num <= 9; num++) {
    if (!canPlace(board, row, col, num)) continue
    board[row][col] = num
    count += countSolutions(board, limit)
    board[row][col] = 0
    if (count >= limit) return count
  }
  return count
}

function findEmptyCell(board: Board): [number, number] | null {
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (board[row][col] === 0) return [row, col]
    }
  }
  return null
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}
