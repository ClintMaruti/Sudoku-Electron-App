export {}

declare global {
  interface Window {
    api: {
      game: {
        new: (difficulty: 'easy' | 'medium' | 'hard') => Promise<NewGameResponse>
        validate: (board: Board) => Promise<ValidationResponse>
        save: (state: GameState) => Promise<void>
        load: () => Promise<GameState | null>
      }
    }
  }
}

export type Difficulty = 'easy' | 'medium' | 'hard'

/** 9x9 board: 0 = empty, 1-9 = filled */
export type Board = number[][]

export interface NewGameResponse {
  board: Board
  solution: Board
  difficulty: Difficulty
}

export interface ValidationResponse {
  valid: boolean
  errors: CellError[]
}

export interface CellError {
  row: number
  col: number
  reason: 'row' | 'column' | 'subgrid'
}

export interface GameState {
  board: Board
  initialBoard: Board
  solution: Board
  difficulty: Difficulty
  moves: Move[]
  timerSeconds: number
}

export interface Move {
  row: number
  col: number
  previousValue: number
  newValue: number
}
