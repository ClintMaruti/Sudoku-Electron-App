import { useState, useEffect, useCallback, useRef } from 'react'
import type { Board, Difficulty, GameState, Move, CellError } from '../../../global'
import {
  createEmptyBoard,
  isBoardSolved,
  boardsEqual,
} from '../utils/board'

const EMPTY_BOARD = createEmptyBoard()

export interface UseGameReturn {
  board: Board
  initialBoard: Board
  solution: Board
  difficulty: Difficulty
  selected: { row: number; col: number } | null
  errors: CellError[]
  moves: Move[]
  timerSeconds: number
  isVictory: boolean
  isLoading: boolean
  showConfirm: boolean
  pendingDifficulty: Difficulty | null
  selectCell: (row: number, col: number) => void
  moveSelection: (dRow: number, dCol: number) => void
  enterDigit: (digit: number) => void
  clearCell: () => void
  undo: () => void
  reset: () => void
  requestNewGame: () => void
  confirmNewGame: () => void
  cancelConfirm: () => void
  save: () => Promise<void>
  load: () => Promise<void>
  setDifficulty: (difficulty: Difficulty) => void
  isGiven: (row: number, col: number) => boolean
  errorSet: Set<string>
}

function errorKey(row: number, col: number): string {
  return `${row},${col}`
}

export function useGame(): UseGameReturn {
  const [board, setBoard] = useState<Board>(EMPTY_BOARD)
  const [initialBoard, setInitialBoard] = useState<Board>(EMPTY_BOARD)
  const [solution, setSolution] = useState<Board>(EMPTY_BOARD)
  const [difficulty, setDifficultyState] = useState<Difficulty>('medium')
  const [selected, setSelected] = useState<{ row: number; col: number } | null>(null)
  const [errors, setErrors] = useState<CellError[]>([])
  const [moves, setMoves] = useState<Move[]>([])
  const [timerSeconds, setTimerSeconds] = useState(0)
  const [timerRunning, setTimerRunning] = useState(false)
  const [isVictory, setIsVictory] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [showConfirm, setShowConfirm] = useState(false)
  const [pendingDifficulty, setPendingDifficulty] = useState<Difficulty | null>(null)
  const initialized = useRef(false)

  const errorSet = new Set(errors.map((e) => errorKey(e.row, e.col)))

  const applyGameState = useCallback((state: {
    board: Board
    initialBoard: Board
    solution: Board
    difficulty: Difficulty
    moves?: Move[]
    timerSeconds?: number
  }) => {
    setBoard(state.board.map((row) => [...row]))
    setInitialBoard(state.initialBoard.map((row) => [...row]))
    setSolution(state.solution.map((row) => [...row]))
    setDifficultyState(state.difficulty)
    setMoves(state.moves ?? [])
    setTimerSeconds(state.timerSeconds ?? 0)
    setTimerRunning((state.moves?.length ?? 0) > 0 && !isBoardSolved(state.board, state.solution))
    setIsVictory(isBoardSolved(state.board, state.solution))
    setErrors([])
    setSelected(null)
  }, [])

  const startNewGame = useCallback(async (diff: Difficulty) => {
    const response = await window.api.game.new(diff)
    applyGameState({
      board: response.board.map((row) => [...row]),
      initialBoard: response.board.map((row) => [...row]),
      solution: response.solution,
      difficulty: response.difficulty,
      moves: [],
      timerSeconds: 0,
    })
    setTimerRunning(false)
    setIsVictory(false)
  }, [applyGameState])

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true

    async function init() {
      try {
        const saved = await window.api.game.load()
        if (saved) {
          applyGameState(saved)
        } else {
          await startNewGame('medium')
        }
      } finally {
        setIsLoading(false)
      }
    }

    void init()
  }, [applyGameState, startNewGame])

  useEffect(() => {
    if (!timerRunning) return
    const id = window.setInterval(() => {
      setTimerSeconds((s) => s + 1)
    }, 1000)
    return () => window.clearInterval(id)
  }, [timerRunning])

  useEffect(() => {
    if (isLoading) return
    void window.api.game.validate(board).then((res) => setErrors(res.errors))
  }, [board, isLoading])

  useEffect(() => {
    if (isLoading) return
    if (isBoardSolved(board, solution)) {
      setIsVictory(true)
      setTimerRunning(false)
    }
  }, [board, solution, isLoading])

  const isGiven = useCallback(
    (row: number, col: number) => initialBoard[row][col] !== 0,
    [initialBoard],
  )

  const startTimerIfNeeded = useCallback(() => {
    if (!timerRunning && !isVictory) {
      setTimerRunning(true)
    }
  }, [timerRunning, isVictory])

  const selectCell = useCallback((row: number, col: number) => {
    setSelected({ row, col })
  }, [])

  const moveSelection = useCallback((dRow: number, dCol: number) => {
    setSelected((prev) => {
      const row = prev ? Math.min(8, Math.max(0, prev.row + dRow)) : 0
      const col = prev ? Math.min(8, Math.max(0, prev.col + dCol)) : 0
      return { row, col }
    })
  }, [])

  const enterDigit = useCallback(
    (digit: number) => {
      if (!selected || isVictory) return
      const { row, col } = selected
      if (isGiven(row, col)) return

      const previousValue = board[row][col]
      if (previousValue === digit) return

      const move: Move = { row, col, previousValue, newValue: digit }
      const next = board.map((r) => [...r])
      next[row][col] = digit

      setBoard(next)
      setMoves((m) => [...m, move])
      startTimerIfNeeded()
    },
    [selected, isVictory, isGiven, board, startTimerIfNeeded],
  )

  const clearCell = useCallback(() => {
    if (!selected || isVictory) return
    const { row, col } = selected
    if (isGiven(row, col)) return

    const previousValue = board[row][col]
    if (previousValue === 0) return

    const move: Move = { row, col, previousValue, newValue: 0 }
    const next = board.map((r) => [...r])
    next[row][col] = 0

    setBoard(next)
    setMoves((m) => [...m, move])
    startTimerIfNeeded()
  }, [selected, isVictory, isGiven, board, startTimerIfNeeded])

  const undo = useCallback(() => {
    if (moves.length === 0) return
    const lastMove = moves[moves.length - 1]
    const next = board.map((r) => [...r])
    next[lastMove.row][lastMove.col] = lastMove.previousValue
    setBoard(next)
    setMoves((m) => m.slice(0, -1))
    setIsVictory(false)
  }, [moves, board])

  const reset = useCallback(() => {
    setBoard(initialBoard.map((row) => [...row]))
    setMoves([])
    setTimerSeconds(0)
    setTimerRunning(false)
    setIsVictory(false)
    setErrors([])
  }, [initialBoard])

  const hasProgress = moves.length > 0 || !boardsEqual(board, initialBoard)

  const requestNewGame = useCallback(() => {
    if (hasProgress) {
      setPendingDifficulty(null)
      setShowConfirm(true)
    } else {
      void startNewGame(pendingDifficulty ?? difficulty)
      setPendingDifficulty(null)
    }
  }, [hasProgress, difficulty, pendingDifficulty, startNewGame])

  const confirmNewGame = useCallback(() => {
    setShowConfirm(false)
    const diff = pendingDifficulty ?? difficulty
    setPendingDifficulty(null)
    void startNewGame(diff)
  }, [pendingDifficulty, difficulty, startNewGame])

  const cancelConfirm = useCallback(() => {
    setShowConfirm(false)
    setPendingDifficulty(null)
  }, [])

  const setDifficulty = useCallback(
    (diff: Difficulty) => {
      setDifficultyState(diff)
      if (hasProgress) {
        setPendingDifficulty(diff)
        setShowConfirm(true)
      }
    },
    [hasProgress],
  )

  const save = useCallback(async () => {
    const state: GameState = {
      board,
      initialBoard,
      solution,
      difficulty,
      moves,
      timerSeconds,
    }
    await window.api.game.save(state)
  }, [board, initialBoard, solution, difficulty, moves, timerSeconds])

  const load = useCallback(async () => {
    const saved = await window.api.game.load()
    if (saved) {
      applyGameState(saved)
    }
  }, [applyGameState])

  useEffect(() => {
    const unsubscribeNew = window.api.menu.onNewGame(() => {
      requestNewGame()
    })
    const unsubscribeSave = window.api.menu.onSave(() => {
      void save()
    })
    const unsubscribeLoad = window.api.menu.onLoad(() => {
      void load()
    })

    return () => {
      unsubscribeNew()
      unsubscribeSave()
      unsubscribeLoad()
    }
  }, [requestNewGame, save, load])

  return {
    board,
    initialBoard,
    solution,
    difficulty,
    selected,
    errors,
    moves,
    timerSeconds,
    isVictory,
    isLoading,
    showConfirm,
    pendingDifficulty,
    selectCell,
    moveSelection,
    enterDigit,
    clearCell,
    undo,
    reset,
    requestNewGame,
    confirmNewGame,
    cancelConfirm,
    save,
    load,
    setDifficulty,
    isGiven,
    errorSet,
  }
}
