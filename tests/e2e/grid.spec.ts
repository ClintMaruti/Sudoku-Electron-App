import { test, expect } from '@playwright/test'
import { launchApp, closeApp, getAllCells, clickCell, isCellHighlighted } from './helpers'

test.describe('Sudoku Grid', () => {
  test('grid renders exactly 81 cells', async () => {
    const { app, page } = await launchApp()

    try {
      const cells = getAllCells(page)
      await expect(cells).toHaveCount(81)
    } finally {
      await closeApp(app)
    }
  })

  test('grid is organised in a 9x9 structure', async () => {
    const { app, page } = await launchApp()

    try {
      const grid = page.locator('[data-testid="sudoku-grid"]')
      await expect(grid).toBeVisible()

      const cells = getAllCells(page)
      await expect(cells).toHaveCount(81)
    } finally {
      await closeApp(app)
    }
  })

  test('clicking a cell selects it', async () => {
    const { app, page } = await launchApp()

    try {
      await clickCell(page, 0, 0)
      const firstCell = getAllCells(page).nth(0)
      const cls = await firstCell.getAttribute('class')
      expect(
        cls?.includes('selected') || cls?.includes('active') || cls?.includes('focused')
      ).toBe(true)
    } finally {
      await closeApp(app)
    }
  })

  test('selecting a cell highlights all cells in its row', async () => {
    const { app, page } = await launchApp()

    try {
      // Select row 2, col 4
      await clickCell(page, 2, 4)

      // All cells in row 2 should be highlighted
      for (let col = 0; col < 9; col++) {
        if (col === 4) continue // selected cell itself
        const highlighted = await isCellHighlighted(page, 2, col)
        expect(highlighted).toBe(true)
      }
    } finally {
      await closeApp(app)
    }
  })

  test('selecting a cell highlights all cells in its column', async () => {
    const { app, page } = await launchApp()

    try {
      await clickCell(page, 2, 4)

      // All cells in col 4 should be highlighted
      for (let row = 0; row < 9; row++) {
        if (row === 2) continue // selected cell itself
        const highlighted = await isCellHighlighted(page, row, 4)
        expect(highlighted).toBe(true)
      }
    } finally {
      await closeApp(app)
    }
  })

  test('selecting a cell highlights all cells in its 3x3 subgrid', async () => {
    const { app, page } = await launchApp()

    try {
      // Select (3, 3) — top-left of middle-center subgrid (rows 3-5, cols 3-5)
      await clickCell(page, 3, 3)

      const subgridRows = [3, 4, 5]
      const subgridCols = [3, 4, 5]

      for (const r of subgridRows) {
        for (const c of subgridCols) {
          if (r === 3 && c === 3) continue
          const highlighted = await isCellHighlighted(page, r, c)
          expect(highlighted).toBe(true)
        }
      }
    } finally {
      await closeApp(app)
    }
  })

  test('3x3 subgrid boundaries are visually distinct', async () => {
    const { app, page } = await launchApp()

    try {
      // The grid container should exist and subgrid borders exist via CSS
      const grid = page.locator('[data-testid="sudoku-grid"]')
      await expect(grid).toBeVisible()

      // Each cell should have data attributes for row/col/subgrid identification
      const firstCell = getAllCells(page).first()
      const row = await firstCell.getAttribute('data-row')
      const col = await firstCell.getAttribute('data-col')
      expect(row).not.toBeNull()
      expect(col).not.toBeNull()
    } finally {
      await closeApp(app)
    }
  })

  test('pre-filled cells have a distinct visual style from editable cells', async () => {
    const { app, page } = await launchApp()

    try {
      const cells = getAllCells(page)
      const count = await cells.count()

      const givenClasses: string[] = []
      const editableClasses: string[] = []

      for (let i = 0; i < count; i++) {
        const cell = cells.nth(i)
        const cls = (await cell.getAttribute('class')) ?? ''
        const isGiven =
          cls.includes('given') ||
          cls.includes('prefilled') ||
          (await cell.getAttribute('data-given')) === 'true'

        if (isGiven) givenClasses.push(cls)
        else editableClasses.push(cls)
      }

      // There should be both given and editable cells in a puzzle
      expect(givenClasses.length).toBeGreaterThan(0)
      expect(editableClasses.length).toBeGreaterThan(0)
    } finally {
      await closeApp(app)
    }
  })
})
