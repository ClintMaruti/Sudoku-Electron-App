import type { Difficulty } from '../../../global'

interface GameControlsProps {
  onNewGame: () => void
  onReset: () => void
  onUndo: () => void
  onSave: () => void
  onLoad: () => void
  undoDisabled: boolean
}

export function GameControls({
  onNewGame,
  onReset,
  onUndo,
  onSave,
  onLoad,
  undoDisabled,
}: GameControlsProps) {
  return (
    <div className="game-controls" role="group" aria-label="Game controls">
      <button type="button" data-testid="btn-new-game" className="control-btn" onClick={onNewGame}>
        New Game
      </button>
      <button type="button" data-testid="btn-reset" className="control-btn" onClick={onReset}>
        Reset
      </button>
      <button
        type="button"
        data-testid="btn-undo"
        className="control-btn"
        onClick={onUndo}
        disabled={undoDisabled}
      >
        Undo
      </button>
      <button type="button" data-testid="btn-save" className="control-btn" onClick={onSave}>
        Save
      </button>
      <button type="button" data-testid="btn-load" className="control-btn" onClick={onLoad}>
        Load
      </button>
    </div>
  )
}

interface DifficultySelectorProps {
  difficulty: Difficulty
  onChange: (difficulty: Difficulty) => void
}

const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
}

export function DifficultySelector({ difficulty, onChange }: DifficultySelectorProps) {
  return (
    <div className="difficulty-panel">
      <label htmlFor="difficulty-select" className="difficulty-label">
        Difficulty
      </label>
      <select
        id="difficulty-select"
        data-testid="difficulty-selector"
        className="difficulty-select"
        value={difficulty}
        onChange={(e) => onChange(e.target.value as Difficulty)}
      >
        <option value="easy">Easy</option>
        <option value="medium">Medium</option>
        <option value="hard">Hard</option>
      </select>
      <span data-testid="current-difficulty" className="current-difficulty">
        {DIFFICULTY_LABELS[difficulty]}
      </span>
    </div>
  )
}

interface TimerProps {
  seconds: number
}

export function Timer({ seconds }: TimerProps) {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  const display = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`

  return (
    <div className="timer" data-testid="timer" aria-live="polite" aria-label={`Elapsed time ${display}`}>
      {display}
    </div>
  )
}

interface VictoryMessageProps {
  visible: boolean
  seconds: number
}

export function VictoryMessage({ visible, seconds }: VictoryMessageProps) {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  const time = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`

  return (
    <div
      className={`victory-message${visible ? ' visible' : ''}`}
      data-testid="victory-message"
      role="status"
      aria-hidden={!visible}
    >
      <h2>Puzzle Complete!</h2>
      <p>You solved it in {time}.</p>
    </div>
  )
}

interface ConfirmDialogProps {
  visible: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({ visible, onConfirm, onCancel }: ConfirmDialogProps) {
  if (!visible) return null

  return (
    <div className="confirm-overlay" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
      <div className="confirm-dialog">
        <h3 id="confirm-title">Start a new game?</h3>
        <p>Your current progress will be lost.</p>
        <div className="confirm-actions">
          <button type="button" className="control-btn" onClick={onCancel}>
            Cancel
          </button>
          <button type="button" data-testid="btn-confirm" className="control-btn primary" onClick={onConfirm}>
            Confirm
          </button>
        </div>
      </div>
    </div>
  )
}
