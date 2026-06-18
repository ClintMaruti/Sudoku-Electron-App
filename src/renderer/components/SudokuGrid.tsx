import type { ReactNode } from 'react'
import {
  isRowComplete,
  isColComplete,
  isSubgridComplete,
  getSubgridStart,
} from '../utils/board'
import type { Board } from '../../../global'

interface SudokuCellProps {
  row: number
  col: number
  value: number
  isGiven: boolean
  isSelected: boolean
  isHighlighted: boolean
  isInvalid: boolean
  isRowDone: boolean
  isColDone: boolean
  isSubgridDone: boolean
  onSelect: (row: number, col: number) => void
}

export function SudokuCell({
  row,
  col,
  value,
  isGiven,
  isSelected,
  isHighlighted,
  isInvalid,
  isRowDone,
  isColDone,
  isSubgridDone,
  onSelect,
}: SudokuCellProps) {
  const classNames = ['sudoku-cell']
  if (isGiven) classNames.push('given')
  if (isSelected) classNames.push('selected')
  else if (isHighlighted) classNames.push('highlighted')
  if (isInvalid) classNames.push('invalid')
  if (isRowDone || isColDone || isSubgridDone) classNames.push('section-complete')

  const thickRight = col === 2 || col === 5
  const thickBottom = row === 2 || row === 5
  if (thickRight) classNames.push('border-right-thick')
  if (thickBottom) classNames.push('border-bottom-thick')

  return (
    <button
      type="button"
      className={classNames.join(' ')}
      data-testid="sudoku-cell"
      data-row={row}
      data-col={col}
      data-given={isGiven ? 'true' : 'false'}
      onClick={() => onSelect(row, col)}
      aria-label={`Row ${row + 1}, column ${col + 1}${value ? `, value ${value}` : ', empty'}`}
      aria-pressed={isSelected}
    >
      {value !== 0 ? value : ''}
    </button>
  )
}

interface SudokuGridProps {
  board: Board
  solution: Board
  selected: { row: number; col: number } | null
  errorSet: Set<string>
  isGiven: (row: number, col: number) => boolean
  onSelect: (row: number, col: number) => void
}

export function SudokuGrid({
  board,
  solution,
  selected,
  errorSet,
  isGiven,
  onSelect,
}: SudokuGridProps) {
  const cells: ReactNode[] = []

  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      const isSelected = selected?.row === row && selected?.col === col
      const isHighlighted =
        !isSelected &&
        selected !== null &&
        (selected.row === row ||
          selected.col === col ||
          (Math.floor(selected.row / 3) === Math.floor(row / 3) &&
            Math.floor(selected.col / 3) === Math.floor(col / 3)))

      const { startRow, startCol } = getSubgridStart(row, col)

      cells.push(
        <SudokuCell
          key={`${row}-${col}`}
          row={row}
          col={col}
          value={board[row][col]}
          isGiven={isGiven(row, col)}
          isSelected={isSelected}
          isHighlighted={isHighlighted}
          isInvalid={errorSet.has(`${row},${col}`)}
          isRowDone={isRowComplete(board, solution, row)}
          isColDone={isColComplete(board, solution, col)}
          isSubgridDone={isSubgridComplete(board, solution, startRow, startCol)}
          onSelect={onSelect}
        />,
      )
    }
  }

  return (
    <div className="sudoku-grid" data-testid="sudoku-grid" role="grid" aria-label="Sudoku board">
      {cells}
    </div>
  )
}
