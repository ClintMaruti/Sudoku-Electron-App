import { describe, it, expect } from 'vitest'
import { applyMove, undoMove } from '../../src/main/engine/undo'
import type { Board, Move } from '../../global'

// ---------------------------------------------------------------------------
// Undo / move stack logic
// ---------------------------------------------------------------------------

function emptyBoard(): Board {
  return Array.from({ length: 9 }, () => Array(9).fill(0))
}

describe('applyMove', () => {
  it('places the value on the board at the correct cell', () => {
    const board = emptyBoard()
    const move: Move = { row: 2, col: 4, previousValue: 0, newValue: 7 }
    const result = applyMove(board, move)
    expect(result[2][4]).toBe(7)
  })

  it('does not mutate the original board', () => {
    const board = emptyBoard()
    const move: Move = { row: 0, col: 0, previousValue: 0, newValue: 5 }
    applyMove(board, move)
    expect(board[0][0]).toBe(0)
  })

  it('returns a new 9x9 board', () => {
    const board = emptyBoard()
    const move: Move = { row: 0, col: 0, previousValue: 0, newValue: 5 }
    const result = applyMove(board, move)
    expect(result).toHaveLength(9)
    result.forEach((row) => expect(row).toHaveLength(9))
  })

  it('supports overwriting an existing cell value', () => {
    const board = emptyBoard()
    board[3][3] = 4
    const move: Move = { row: 3, col: 3, previousValue: 4, newValue: 9 }
    const result = applyMove(board, move)
    expect(result[3][3]).toBe(9)
  })
})

describe('undoMove', () => {
  it('reverts a cell to its previous value', () => {
    const board = emptyBoard()
    board[1][5] = 6
    const move: Move = { row: 1, col: 5, previousValue: 0, newValue: 6 }
    const result = undoMove(board, move)
    expect(result[1][5]).toBe(0)
  })

  it('does not mutate the original board', () => {
    const board = emptyBoard()
    board[0][0] = 3
    const move: Move = { row: 0, col: 0, previousValue: 0, newValue: 3 }
    undoMove(board, move)
    expect(board[0][0]).toBe(3)
  })

  it('returns a new 9x9 board', () => {
    const board = emptyBoard()
    const move: Move = { row: 0, col: 0, previousValue: 0, newValue: 5 }
    const result = undoMove(board, move)
    expect(result).toHaveLength(9)
    result.forEach((row) => expect(row).toHaveLength(9))
  })

  it('reverts to a non-zero previous value (overwrite scenario)', () => {
    const board = emptyBoard()
    board[4][4] = 9
    const move: Move = { row: 4, col: 4, previousValue: 3, newValue: 9 }
    const result = undoMove(board, move)
    expect(result[4][4]).toBe(3)
  })

  it('reverts exactly one move — other cells are unchanged', () => {
    const board = emptyBoard()
    board[0][0] = 1
    board[2][2] = 5
    const move: Move = { row: 2, col: 2, previousValue: 0, newValue: 5 }
    const result = undoMove(board, move)
    expect(result[0][0]).toBe(1) // untouched
    expect(result[2][2]).toBe(0) // reverted
  })

  it('chaining applyMove then undoMove restores the board to its original state', () => {
    const original = emptyBoard()
    const move: Move = { row: 3, col: 7, previousValue: 0, newValue: 8 }

    const after = applyMove(original, move)
    expect(after[3][7]).toBe(8)

    const reverted = undoMove(after, move)
    expect(reverted[3][7]).toBe(0)

    // Full deep equality
    expect(reverted).toEqual(original)
  })
})

// ---------------------------------------------------------------------------
// Move stack management (multi-step undo)
// ---------------------------------------------------------------------------

describe('move stack — multi-step undo', () => {
  it('reverts two moves in LIFO order', () => {
    let board = emptyBoard()
    const moves: Move[] = []

    const m1: Move = { row: 0, col: 0, previousValue: 0, newValue: 1 }
    board = applyMove(board, m1)
    moves.push(m1)

    const m2: Move = { row: 1, col: 1, previousValue: 0, newValue: 2 }
    board = applyMove(board, m2)
    moves.push(m2)

    // Undo last move (m2)
    const lastMove = moves.pop()!
    board = undoMove(board, lastMove)
    expect(board[1][1]).toBe(0)
    expect(board[0][0]).toBe(1) // m1 still in effect

    // Undo m1
    const prevMove = moves.pop()!
    board = undoMove(board, prevMove)
    expect(board[0][0]).toBe(0)
  })

  it('undo with empty stack leaves board unchanged', () => {
    const board = emptyBoard()
    const moves: Move[] = []
    // Nothing to undo — stack is empty
    const result = moves.length > 0 ? undoMove(board, moves[moves.length - 1]) : board
    expect(result).toEqual(board)
  })

  it('undo after ten moves reverts exactly the last one', () => {
    let board = emptyBoard()
    const moves: Move[] = []

    for (let i = 0; i < 9; i++) {
      const move: Move = { row: i, col: 0, previousValue: 0, newValue: i + 1 }
      board = applyMove(board, move)
      moves.push(move)
    }

    // Undo only the last
    const last = moves.pop()!
    board = undoMove(board, last)

    // Last cell reverted
    expect(board[8][0]).toBe(0)
    // All earlier cells still filled
    for (let i = 0; i < 8; i++) {
      expect(board[i][0]).toBe(i + 1)
    }
  })
})
