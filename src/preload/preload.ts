import { contextBridge, ipcRenderer } from 'electron'
import type { Board, Difficulty, GameState, NewGameResponse, ValidationResponse } from '../../global'

const isTestMode = process.argv.includes('--test-mode')

function subscribeMenuEvent(channel: string, callback: () => void): () => void {
  const handler = () => callback()
  ipcRenderer.on(channel, handler)
  return () => ipcRenderer.removeListener(channel, handler)
}

const gameApi = {
  new: (difficulty: Difficulty): Promise<NewGameResponse> =>
    ipcRenderer.invoke('game:new', difficulty),
  validate: (board: Board): Promise<ValidationResponse> =>
    ipcRenderer.invoke('game:validate', board),
  save: (state: GameState): Promise<void> => ipcRenderer.invoke('game:save', state),
  load: (): Promise<GameState | null> => ipcRenderer.invoke('game:load'),
}

const devApi = isTestMode
  ? {
      getSolution: (): Promise<Board | null> =>
        ipcRenderer.invoke('game:dev:getSolution'),
    }
  : undefined

const menuApi = {
  onNewGame: (callback: () => void) => subscribeMenuEvent('menu:new-game', callback),
  onSave: (callback: () => void) => subscribeMenuEvent('menu:save', callback),
  onLoad: (callback: () => void) => subscribeMenuEvent('menu:load', callback),
}

contextBridge.exposeInMainWorld('api', {
  game: devApi ? { ...gameApi, dev: devApi } : gameApi,
  menu: menuApi,
})
