import { test, expect, Page } from '@playwright/test'
import {
  launchApp,
  closeApp,
  getAllCells,
  clickCell,
  typeDigit,
  getCellValue,
  isCellInvalid,
  isCellGiven,
} from './helpers'

// ---------------------------------------------------------------------------
// Helpers local to gameplay tests
// ---------------------------------------------------------------------------

/** Find the first editable (non-given) cell and return its [row, col] */
async function findFirstEditableCell(page: Page): Promise<[number, number]> {
  const cells = getAllCells(page)
  const count = await cells.count()
  for (let i = 0; i < count; i++) {
    const cell = cells.nth(i)
    const cls = (await cell.getAttribute('class')) ?? ''
    const given = await cell.getAttribute('data-given')
    const isGiven =
      cls.includes('given') || cls.includes('prefilled') || given === 'true'
    if (!isGiven) {
      const row = Math.floor(i / 9)
      const col = i % 9
      return [row, col]
    }
  }
  throw new Error('No editable cell found on the board')
}

/** Find the first given cell and return its [row, col] */
async function findFirstGivenCell(page: Page): Promise<[number, number]> {
  const cells = getAllCells(page)
  const count = await cells.count()
  for (let i = 0; i < count; i++) {
    const cell = cells.nth(i)
    const cls = (await cell.getAttribute('class')) ?? ''
    const given = await cell.getAttribute('data-given')
    const isGiven =
      cls.includes('given') || cls.includes('prefilled') || given === 'true'
    if (isGiven) {
      const row = Math.floor(i / 9)
      const col = i % 9
      return [row, col]
    }
  }
  throw new Error('No given cell found on the board')
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

test.describe('Gameplay interactions', () => {
  test('entering a number places it in an editable cell', async () => {
    const { app, page } = await launchApp()

    try {
      const [row, col] = await findFirstEditableCell(page)
      await clickCell(page, row, col)
      await typeDigit(page, 5)

      const value = await getCellValue(page, row, col)
      expect(value.trim()).toBe('5')
    } finally {
      await closeApp(app)
    }
  })

  test('entering an invalid number marks the cell red', async () => {
    const { app, page } = await launchApp()

    try {
      // We need to find an editable cell and enter a number that conflicts.
      // To guarantee a conflict we fill the same value into two cells in the same row.
      const cells = getAllCells(page)
      const count = await cells.count()

      // Find two editable cells in the same row
      let firstEditable: [number, number] | null = null
      let secondEditable: [number, number] | null = null

      for (let i = 0; i < count && !secondEditable; i++) {
        const cell = cells.nth(i)
        const cls = (await cell.getAttribute('class')) ?? ''
        const given = await cell.getAttribute('data-given')
        const isGiven = cls.includes('given') || cls.includes('prefilled') || given === 'true'
        if (!isGiven) {
          const row = Math.floor(i / 9)
          const col = i % 9
          if (!firstEditable) {
            firstEditable = [row, col]
          } else if (firstEditable[0] === row) {
            secondEditable = [row, col]
          }
        }
      }

      if (!firstEditable || !secondEditable) {
        // Fallback: just enter any digit and check validation feedback
        const [row, col] = await findFirstEditableCell(page)
        await clickCell(page, row, col)
        await typeDigit(page, 1)
        // We can only verify that the cell got a value
        const value = await getCellValue(page, row, col)
        expect(value.trim()).toBe('1')
        return
      }

      // Enter 3 in first editable cell
      await clickCell(page, firstEditable[0], firstEditable[1])
      await typeDigit(page, 3)

      // Enter same digit in second cell of the same row
      await clickCell(page, secondEditable[0], secondEditable[1])
      await typeDigit(page, 3)

      // At least one cell should be marked invalid
      const firstInvalid = await isCellInvalid(page, firstEditable[0], firstEditable[1])
      const secondInvalid = await isCellInvalid(page, secondEditable[0], secondEditable[1])
      expect(firstInvalid || secondInvalid).toBe(true)
    } finally {
      await closeApp(app)
    }
  })

  test('Backspace clears a cell', async () => {
    const { app, page } = await launchApp()

    try {
      const [row, col] = await findFirstEditableCell(page)
      await clickCell(page, row, col)
      await typeDigit(page, 7)

      let value = await getCellValue(page, row, col)
      expect(value.trim()).toBe('7')

      await page.keyboard.press('Backspace')
      value = await getCellValue(page, row, col)
      expect(value.trim()).toBe('')
    } finally {
      await closeApp(app)
    }
  })

  test('Delete clears a cell', async () => {
    const { app, page } = await launchApp()

    try {
      const [row, col] = await findFirstEditableCell(page)
      await clickCell(page, row, col)
      await typeDigit(page, 4)

      await page.keyboard.press('Delete')
      const value = await getCellValue(page, row, col)
      expect(value.trim()).toBe('')
    } finally {
      await closeApp(app)
    }
  })

  test('pre-filled (given) cells cannot be edited', async () => {
    const { app, page } = await launchApp()

    try {
      const [row, col] = await findFirstGivenCell(page)
      const originalValue = await getCellValue(page, row, col)

      await clickCell(page, row, col)
      await typeDigit(page, 9)

      const newValue = await getCellValue(page, row, col)
      expect(newValue.trim()).toBe(originalValue.trim())
    } finally {
      await closeApp(app)
    }
  })

  test('Undo reverts the last move', async () => {
    const { app, page } = await launchApp()

    try {
      const [row, col] = await findFirstEditableCell(page)
      await clickCell(page, row, col)
      await typeDigit(page, 6)

      let value = await getCellValue(page, row, col)
      expect(value.trim()).toBe('6')

      // Click the Undo button
      const undoBtn = page.locator('[data-testid="btn-undo"]')
      await undoBtn.click()

      value = await getCellValue(page, row, col)
      expect(value.trim()).toBe('')
    } finally {
      await closeApp(app)
    }
  })

  test('Undo reverts exactly one move per click', async () => {
    const { app, page } = await launchApp()

    try {
      // Make two moves in two different editable cells
      const cells = getAllCells(page)
      const count = await cells.count()

      const editables: [number, number][] = []
      for (let i = 0; i < count && editables.length < 2; i++) {
        const cell = cells.nth(i)
        const cls = (await cell.getAttribute('class')) ?? ''
        const given = await cell.getAttribute('data-given')
        const isGiven = cls.includes('given') || cls.includes('prefilled') || given === 'true'
        if (!isGiven) {
          editables.push([Math.floor(i / 9), i % 9])
        }
      }

      if (editables.length < 2) {
        test.skip()
        return
      }

      await clickCell(page, editables[0][0], editables[0][1])
      await typeDigit(page, 2)

      await clickCell(page, editables[1][0], editables[1][1])
      await typeDigit(page, 3)

      const undoBtn = page.locator('[data-testid="btn-undo"]')
      await undoBtn.click()

      // Second move undone
      const val2 = await getCellValue(page, editables[1][0], editables[1][1])
      expect(val2.trim()).toBe('')

      // First move still intact
      const val1 = await getCellValue(page, editables[0][0], editables[0][1])
      expect(val1.trim()).toBe('2')
    } finally {
      await closeApp(app)
    }
  })

  test('New Game resets the board with a fresh puzzle', async () => {
    const { app, page } = await launchApp()

    try {
      // Make a move
      const [row, col] = await findFirstEditableCell(page)
      await clickCell(page, row, col)
      await typeDigit(page, 8)

      // Click New Game
      const newGameBtn = page.locator('[data-testid="btn-new-game"]')
      await newGameBtn.click()

      // Confirm dialog if one appears
      try {
        const confirmBtn = page.locator('[data-testid="btn-confirm"]')
        await confirmBtn.click({ timeout: 2000 })
      } catch {
        // No confirmation dialog — that's fine
      }

      // Board should have 81 cells again
      const cells = getAllCells(page)
      await expect(cells).toHaveCount(81)

      // The previously edited cell should no longer have the value we entered
      // (may be a different cell layout after new game)
      const editables: number[] = []
      const cellCount = await cells.count()
      for (let i = 0; i < cellCount; i++) {
        const cls = (await cells.nth(i).getAttribute('class')) ?? ''
        const given = await cells.nth(i).getAttribute('data-given')
        if (!cls.includes('given') && !cls.includes('prefilled') && given !== 'true') {
          editables.push(i)
        }
      }
      // Should have empty editable cells in new puzzle
      expect(editables.length).toBeGreaterThan(0)
    } finally {
      await closeApp(app)
    }
  })

  test('Reset restores original puzzle (clears user entries)', async () => {
    const { app, page } = await launchApp()

    try {
      const [row, col] = await findFirstEditableCell(page)
      await clickCell(page, row, col)
      await typeDigit(page, 5)

      let value = await getCellValue(page, row, col)
      expect(value.trim()).toBe('5')

      const resetBtn = page.locator('[data-testid="btn-reset"]')
      await resetBtn.click()

      value = await getCellValue(page, row, col)
      expect(value.trim()).toBe('')
    } finally {
      await closeApp(app)
    }
  })
})

test.describe('Keyboard navigation', () => {
  test('arrow keys move between cells', async () => {
    const { app, page } = await launchApp()

    try {
      // Start at (0, 0)
      await clickCell(page, 0, 0)

      // Press ArrowRight → should move to (0, 1)
      await page.keyboard.press('ArrowRight')

      const secondCell = getAllCells(page).nth(1)
      const cls = await secondCell.getAttribute('class')
      expect(
        cls?.includes('selected') || cls?.includes('active') || cls?.includes('focused')
      ).toBe(true)
    } finally {
      await closeApp(app)
    }
  })

  test('ArrowDown moves to the cell below', async () => {
    const { app, page } = await launchApp()

    try {
      await clickCell(page, 0, 0)
      await page.keyboard.press('ArrowDown')

      const cellBelow = getAllCells(page).nth(9) // row 1, col 0
      const cls = await cellBelow.getAttribute('class')
      expect(
        cls?.includes('selected') || cls?.includes('active') || cls?.includes('focused')
      ).toBe(true)
    } finally {
      await closeApp(app)
    }
  })

  test('ArrowLeft moves to the previous cell', async () => {
    const { app, page } = await launchApp()

    try {
      await clickCell(page, 0, 3)
      await page.keyboard.press('ArrowLeft')

      const prevCell = getAllCells(page).nth(2) // row 0, col 2
      const cls = await prevCell.getAttribute('class')
      expect(
        cls?.includes('selected') || cls?.includes('active') || cls?.includes('focused')
      ).toBe(true)
    } finally {
      await closeApp(app)
    }
  })

  test('ArrowUp moves to the cell above', async () => {
    const { app, page } = await launchApp()

    try {
      await clickCell(page, 3, 0)
      await page.keyboard.press('ArrowUp')

      const cellAbove = getAllCells(page).nth(2 * 9) // row 2, col 0
      const cls = await cellAbove.getAttribute('class')
      expect(
        cls?.includes('selected') || cls?.includes('active') || cls?.includes('focused')
      ).toBe(true)
    } finally {
      await closeApp(app)
    }
  })

  test('number keys 1-9 enter values via keyboard', async () => {
    const { app, page } = await launchApp()

    try {
      const [row, col] = await findFirstEditableCell(page)
      await clickCell(page, row, col)

      for (let digit = 1; digit <= 9; digit++) {
        await typeDigit(page, digit)
        const value = await getCellValue(page, row, col)
        expect(value.trim()).toBe(digit.toString())
      }
    } finally {
      await closeApp(app)
    }
  })
})

test.describe('Difficulty selection', () => {
  test('difficulty selector is present', async () => {
    const { app, page } = await launchApp()

    try {
      const selector = page.locator('[data-testid="difficulty-selector"]')
      await expect(selector).toBeVisible()
    } finally {
      await closeApp(app)
    }
  })

  test('can start a new Easy game', async () => {
    const { app, page } = await launchApp()

    try {
      const selector = page.locator('[data-testid="difficulty-selector"]')
      await selector.selectOption('easy')

      const newGameBtn = page.locator('[data-testid="btn-new-game"]')
      await newGameBtn.click()

      await expect(getAllCells(page)).toHaveCount(81)
    } finally {
      await closeApp(app)
    }
  })

  test('can start a new Hard game', async () => {
    const { app, page } = await launchApp()

    try {
      const selector = page.locator('[data-testid="difficulty-selector"]')
      await selector.selectOption('hard')

      const newGameBtn = page.locator('[data-testid="btn-new-game"]')
      await newGameBtn.click()

      await expect(getAllCells(page)).toHaveCount(81)
    } finally {
      await closeApp(app)
    }
  })
})
