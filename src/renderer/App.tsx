import { useEffect, useCallback } from 'react'
import { useGame } from './hooks/useGame'
import { SudokuGrid } from './components/SudokuGrid'
import { NumberPad } from './components/NumberPad'
import {
  GameControls,
  DifficultySelector,
  Timer,
  VictoryMessage,
  ConfirmDialog,
} from './components/GameControls'

export default function App() {
  const game = useGame()

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (game.isLoading) return

      if (e.key >= '1' && e.key <= '9') {
        e.preventDefault()
        game.enterDigit(parseInt(e.key, 10))
        return
      }

      switch (e.key) {
        case 'Backspace':
        case 'Delete':
          e.preventDefault()
          game.clearCell()
          break
        case 'ArrowUp':
          e.preventDefault()
          game.moveSelection(-1, 0)
          break
        case 'ArrowDown':
          e.preventDefault()
          game.moveSelection(1, 0)
          break
        case 'ArrowLeft':
          e.preventDefault()
          game.moveSelection(0, -1)
          break
        case 'ArrowRight':
          e.preventDefault()
          game.moveSelection(0, 1)
          break
        default:
          break
      }
    },
    [game],
  )

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  if (game.isLoading) {
    return (
      <div className="app loading">
        <p>Loading puzzle…</p>
      </div>
    )
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>Sudoku</h1>
        <Timer seconds={game.timerSeconds} />
      </header>

      <main className="app-main">
        <aside className="sidebar">
          <DifficultySelector difficulty={game.difficulty} onChange={game.setDifficulty} />
          <GameControls
            onNewGame={game.requestNewGame}
            onReset={game.reset}
            onUndo={game.undo}
            onSave={() => void game.save()}
            onLoad={() => void game.load()}
            undoDisabled={game.moves.length === 0}
          />
          <NumberPad
            onDigit={game.enterDigit}
            onClear={game.clearCell}
            disabled={game.isVictory}
          />
        </aside>

        <section className="board-section">
          <SudokuGrid
            board={game.board}
            solution={game.solution}
            selected={game.selected}
            errorSet={game.errorSet}
            isGiven={game.isGiven}
            onSelect={game.selectCell}
          />
        </section>
      </main>

      <VictoryMessage visible={game.isVictory} seconds={game.timerSeconds} />
      <ConfirmDialog
        visible={game.showConfirm}
        onConfirm={game.confirmNewGame}
        onCancel={game.cancelConfirm}
      />
    </div>
  )
}
