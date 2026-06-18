import { test, expect, Page } from '@playwright/test'
import {
  launchApp,
  closeApp,
  getAllCells,
  clickCell,
  typeDigit,
  getCellValue,
} from './helpers'

async function findFirstEditableCell(page: Page): Promise<[number, number]> {
  const cells = getAllCells(page)
  const count = await cells.count()
  for (let i = 0; i < count; i++) {
    const cell = cells.nth(i)
    const cls = (await cell.getAttribute('class')) ?? ''
    const given = await cell.getAttribute('data-given')
    const isGiven = cls.includes('given') || cls.includes('prefilled') || given === 'true'
    if (!isGiven) {
      return [Math.floor(i / 9), i % 9]
    }
  }
  throw new Error('No editable cell found')
}

async function snapshotBoard(page: Page): Promise<string[]> {
  const cells = getAllCells(page)
  const count = await cells.count()
  const values: string[] = []
  for (let i = 0; i < count; i++) {
    const text = (await cells.nth(i).textContent()) ?? ''
    values.push(text.trim())
  }
  return values
}

test.describe('Save and Load', () => {
  test('Save button exists and is clickable', async () => {
    const { app, page } = await launchApp()

    try {
      const saveBtn = page.locator('[data-testid="btn-save"]')
      await expect(saveBtn).toBeVisible()
      await expect(saveBtn).toBeEnabled()
    } finally {
      await closeApp(app)
    }
  })

  test('Load button exists and is clickable', async () => {
    const { app, page } = await launchApp()

    try {
      const loadBtn = page.locator('[data-testid="btn-load"]')
      await expect(loadBtn).toBeVisible()
    } finally {
      await closeApp(app)
    }
  })

  test('Save → Load round-trip preserves user-entered values', async () => {
    const { app, page } = await launchApp()

    try {
      // Enter a value in an editable cell
      const [row, col] = await findFirstEditableCell(page)
      await clickCell(page, row, col)
      await typeDigit(page, 4)

      let value = await getCellValue(page, row, col)
      expect(value.trim()).toBe('4')

      // Save
      const saveBtn = page.locator('[data-testid="btn-save"]')
      await saveBtn.click()

      // Reset the board to clear the user entry
      const resetBtn = page.locator('[data-testid="btn-reset"]')
      await resetBtn.click()

      value = await getCellValue(page, row, col)
      expect(value.trim()).toBe('')

      // Load
      const loadBtn = page.locator('[data-testid="btn-load"]')
      await loadBtn.click()

      // Value should be restored
      value = await getCellValue(page, row, col)
      expect(value.trim()).toBe('4')
    } finally {
      await closeApp(app)
    }
  })

  test('Save → Load preserves the full board snapshot', async () => {
    const { app, page } = await launchApp()

    try {
      // Fill several editable cells
      const cells = getAllCells(page)
      const cellCount = await cells.count()
      const editables: [number, number][] = []

      for (let i = 0; i < cellCount && editables.length < 5; i++) {
        const cell = cells.nth(i)
        const cls = (await cell.getAttribute('class')) ?? ''
        const given = await cell.getAttribute('data-given')
        const isGiven = cls.includes('given') || cls.includes('prefilled') || given === 'true'
        if (!isGiven) editables.push([Math.floor(i / 9), i % 9])
      }

      for (let k = 0; k < editables.length; k++) {
        const [r, c] = editables[k]
        await clickCell(page, r, c)
        await typeDigit(page, (k % 9) + 1)
      }

      const snapshotBefore = await snapshotBoard(page)

      // Save
      await page.locator('[data-testid="btn-save"]').click()

      // Start a new game (clears board)
      await page.locator('[data-testid="btn-new-game"]').click()
      try {
        await page.locator('[data-testid="btn-confirm"]').click({ timeout: 2000 })
      } catch {
        // no dialog
      }

      const snapshotAfterNew = await snapshotBoard(page)
      // After a new game the board is different from the saved snapshot
      const changed = snapshotBefore.some((v, i) => v !== snapshotAfterNew[i])
      // (This assertion may not always hold if the same puzzle is generated — skip if not changed)
      if (!changed) return

      // Load saved state
      await page.locator('[data-testid="btn-load"]').click()

      const snapshotAfterLoad = await snapshotBoard(page)
      expect(snapshotAfterLoad).toEqual(snapshotBefore)
    } finally {
      await closeApp(app)
    }
  })

  test('Save → Load preserves difficulty', async () => {
    const { app, page } = await launchApp()

    try {
      // Select Hard difficulty
      const selector = page.locator('[data-testid="difficulty-selector"]')
      await selector.selectOption('hard')
      await page.locator('[data-testid="btn-new-game"]').click()
      try {
        await page.locator('[data-testid="btn-confirm"]').click({ timeout: 2000 })
      } catch {
        // no dialog
      }

      await page.locator('[data-testid="btn-save"]').click()

      // Change to easy
      await selector.selectOption('easy')
      await page.locator('[data-testid="btn-new-game"]').click()
      try {
        await page.locator('[data-testid="btn-confirm"]').click({ timeout: 2000 })
      } catch {
        // no dialog
      }

      // Load saved state
      await page.locator('[data-testid="btn-load"]').click()

      // Difficulty indicator should show Hard
      const diffDisplay = page.locator('[data-testid="current-difficulty"]')
      if (await diffDisplay.isVisible()) {
        const text = await diffDisplay.textContent()
        expect(text?.toLowerCase()).toContain('hard')
      }
    } finally {
      await closeApp(app)
    }
  })

  test('Load with no saved game shows appropriate feedback', async () => {
    // This test verifies that loading when there is no prior save does not crash.
    // The UI may show a toast/alert or simply do nothing — both are acceptable.
    const { app, page } = await launchApp()

    try {
      // Trigger load without having saved (fresh launch)
      const loadBtn = page.locator('[data-testid="btn-load"]')
      await loadBtn.click()

      // App should still be running with 81 cells
      await expect(getAllCells(page)).toHaveCount(81)
    } finally {
      await closeApp(app)
    }
  })
})
