import { _electron as electron, ElectronApplication, Page } from '@playwright/test'
import path from 'path'

export async function launchApp(): Promise<{ app: ElectronApplication; page: Page }> {
  const app = await electron.launch({
    args: [path.join(process.cwd(), 'out/main/main.js')],
    env: { ...process.env, NODE_ENV: 'test' },
  })

  const page = await app.firstWindow()
  await page.waitForLoadState('domcontentloaded')

  return { app, page }
}

export async function closeApp(app: ElectronApplication): Promise<void> {
  await app.close()
}

/** Returns all 81 cell locators */
export function getAllCells(page: Page) {
  return page.locator('[data-testid="sudoku-cell"]')
}

/** Click cell at (row, col) — 0-indexed */
export async function clickCell(page: Page, row: number, col: number): Promise<void> {
  const index = row * 9 + col
  await getAllCells(page).nth(index).click()
}

/** Type a digit into the currently selected cell */
export async function typeDigit(page: Page, digit: number): Promise<void> {
  await page.keyboard.press(digit.toString())
}

/** Get the value displayed in cell (row, col) */
export async function getCellValue(page: Page, row: number, col: number): Promise<string> {
  const index = row * 9 + col
  return (await getAllCells(page).nth(index).textContent()) ?? ''
}

/** Returns true if the cell is marked as invalid (has error class) */
export async function isCellInvalid(page: Page, row: number, col: number): Promise<boolean> {
  const index = row * 9 + col
  const cell = getAllCells(page).nth(index)
  const cls = await cell.getAttribute('class')
  return cls?.includes('invalid') ?? cls?.includes('error') ?? false
}

/** Returns true if the cell is highlighted (selected, row, col, or subgrid) */
export async function isCellHighlighted(page: Page, row: number, col: number): Promise<boolean> {
  const index = row * 9 + col
  const cell = getAllCells(page).nth(index)
  const cls = await cell.getAttribute('class')
  return (
    cls?.includes('highlighted') ??
    cls?.includes('selected') ??
    cls?.includes('active') ??
    false
  )
}

/** Returns true if the cell is marked as a given (pre-filled, non-editable) */
export async function isCellGiven(page: Page, row: number, col: number): Promise<boolean> {
  const index = row * 9 + col
  const cell = getAllCells(page).nth(index)
  const cls = await cell.getAttribute('class')
  const readonly = await cell.getAttribute('data-given')
  return cls?.includes('given') ?? cls?.includes('prefilled') ?? readonly === 'true' ?? false
}
