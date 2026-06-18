import type { Board } from '../../../global'

export function createEmptyBoard(): Board {
  return Array.from({ length: 9 }, () => Array(9).fill(0))
}

export function boardsEqual(a: Board, b: Board): boolean {
  return a.every((row, r) => row.every((val, c) => val === b[r][c]))
}

export function isRowComplete(board: Board, solution: Board, row: number): boolean {
  return board[row].every((val, col) => val !== 0 && val === solution[row][col])
}

export function isColComplete(board: Board, solution: Board, col: number): boolean {
  return board.every((row, r) => row[col] !== 0 && row[col] === solution[r][col])
}

export function isSubgridComplete(board: Board, solution: Board, startRow: number, startCol: number): boolean {
  for (let r = startRow; r < startRow + 3; r++) {
    for (let c = startCol; c < startCol + 3; c++) {
      if (board[r][c] === 0 || board[r][c] !== solution[r][c]) {
        return false
      }
    }
  }
  return true
}

export function getSubgridStart(row: number, col: number): { startRow: number; startCol: number } {
  return {
    startRow: Math.floor(row / 3) * 3,
    startCol: Math.floor(col / 3) * 3,
  }
}

export function isBoardSolved(board: Board, solution: Board): boolean {
  return board.every((row, r) => row.every((val, c) => val !== 0 && val === solution[r][c]))
}

export function formatTimer(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}
