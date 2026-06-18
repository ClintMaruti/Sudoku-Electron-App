import { ipcMain } from 'electron'
import {
  handleGameNew,
  handleGameValidate,
  handleGameSave,
  handleGameLoad,
  handleGameDevGetSolution,
} from './handlers'

export function registerIpcHandlers(): void {
  ipcMain.handle('game:new', (_event, difficulty) => handleGameNew(difficulty))
  ipcMain.handle('game:validate', (_event, board) => handleGameValidate(board))
  ipcMain.handle('game:save', (_event, state) => handleGameSave(state))
  ipcMain.handle('game:load', () => handleGameLoad())

  if (process.env.NODE_ENV === 'test') {
    ipcMain.handle('game:dev:getSolution', () => handleGameDevGetSolution())
  }
}
